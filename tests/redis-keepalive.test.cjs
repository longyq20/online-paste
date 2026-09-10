const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')

// Compile the actual route without adding a test framework or TS runtime.
const routePath = path.join(__dirname, '../app/api/cron/redis-keepalive/route.ts')
const compiled = ts.transpileModule(fs.readFileSync(routePath, 'utf8'), {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020,
    esModuleInterop: true,
  },
}).outputText

function setup({ env = {}, fail = false, acknowledgement = 'OK' } = {}) {
  const writes = []
  const logs = []
  let connections = 0
  let disconnects = 0
  class Redis {
    constructor() { connections++ }
    on() {}
    async set(...args) {
      if (fail) throw new Error('Connection failed: secret-must-not-leak')
      writes.push(args)
      return acknowledgement
    }
    disconnect() { disconnects++ }
  }
  const module = { exports: {} }
  vm.runInNewContext(compiled, {
    module,
    exports: module.exports,
    require: (name) => name === 'ioredis' ? Redis : require(name),
    process: { env },
    console: {
      info: (...args) => logs.push(args),
      error: (...args) => logs.push(args),
    },
  }, { filename: routePath })
  return {
    invoke: (authorization) => module.exports.GET(new Request('http://localhost/api/cron/redis-keepalive', {
      headers: authorization ? { authorization } : {},
    })),
    writes,
    logs,
    get connections() { return connections },
    get disconnects() { return disconnects },
  }
}

const env = { CRON_SECRET: 'test-only-cron-secret', REDIS_URL: 'redis://localhost:6379' }
const authorization = `Bearer ${env.CRON_SECRET}`

test('missing cron configuration fails closed without contacting Redis', async () => {
  const app = setup({ env: { REDIS_URL: env.REDIS_URL } })
  const response = await app.invoke()
  assert.equal(response.status, 503)
  assert.equal(response.headers.get('cache-control'), 'no-store')
  assert.equal(app.connections, 0)
})

test('missing and incorrect credentials cannot trigger Redis traffic', async () => {
  const app = setup({ env })
  for (const header of [undefined, 'Bearer wrong', env.CRON_SECRET]) {
    assert.equal((await app.invoke(header)).status, 401)
  }
  assert.equal(app.connections, 0)
})

test('missing Redis configuration cannot report a successful local fallback', async () => {
  const app = setup({ env: { CRON_SECRET: env.CRON_SECRET } })
  assert.equal((await app.invoke(authorization)).status, 503)
  assert.equal(app.connections, 0)
})

test('authenticated runs overwrite one expiring heartbeat key, leaving rooms alone', async () => {
  const app = setup({ env })
  for (let i = 0; i < 2; i++) {
    const response = await app.invoke(authorization)
    const result = await response.json()
    assert.equal(response.status, 200)
    assert.equal(response.headers.get('cache-control'), 'no-store')
    assert.equal(result.ok, true)
    assert.ok(Number.isFinite(Date.parse(result.lastKeepAlive)))
    const [key, value, expiryMode, ttl] = app.writes[i]
    assert.equal(key, 'online-paste:keepalive')
    assert.equal(value, result.lastKeepAlive)
    assert.equal(expiryMode, 'EX')
    assert.ok(ttl > 86400 && ttl <= 7 * 86400)
  }
  assert.equal(app.writes.length, 2)
  assert.equal(app.disconnects, 2)
})

test('Redis failures return 503, release the connection, and hide sensitive error details', async () => {
  const app = setup({ env, fail: true })
  const response = await app.invoke(authorization)
  assert.equal(response.status, 503)
  assert.equal(response.headers.get('cache-control'), 'no-store')
  assert.equal(app.disconnects, 1)
  assert.equal(app.writes.length, 0)
  assert.doesNotMatch(await response.text(), /secret-must-not-leak/)
  assert.doesNotMatch(JSON.stringify(app.logs), /secret-must-not-leak/)
})

test('an unacknowledged write is not reported as a successful heartbeat', async () => {
  const app = setup({ env, acknowledgement: null })
  assert.equal((await app.invoke(authorization)).status, 503)
  assert.equal(app.disconnects, 1)
})
