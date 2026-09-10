const { test } = require('node:test')
const assert = require('node:assert/strict')
const path = require('node:path')
const url = require('node:url')
const Redis = require('ioredis')
const loadTypeScript = require('./helpers/load-typescript.cjs')

const optionsModule = loadTypeScript(path.join(__dirname, '../lib/redis-options.ts'))
const { redisOptionsFromUrl } = optionsModule

test('preserves Redis host, explicit port, and decoded credentials', () => {
  const options = redisOptionsFromUrl('redis://user%40team:p%40ss%3Aword%2F%25@example.com:16434/2')
  assert.equal(options.host, 'example.com')
  assert.equal(options.port, 16434)
  assert.equal(options.username, 'user@team')
  assert.equal(options.password, 'p@ss:word/%')
  assert.equal(options.db, 2)
  assert.equal(options.tls, undefined)
})

test('supports password-only auth, default port/database, and IPv6', () => {
  const options = redisOptionsFromUrl('redis://:password@[::1]')
  assert.equal(options.host, '::1')
  assert.equal(options.port, 6379)
  assert.equal(options.username, '')
  assert.equal(options.password, 'password')
  assert.equal(options.db, 0)
})

test('rediss enables TLS and URL fields take precedence over query options', () => {
  const options = redisOptionsFromUrl('rediss://default:password@example.com:6380/3?db=9&port=6379&family=6&connectionName=clipboard')
  assert.equal(options.port, 6380)
  assert.equal(options.db, 3)
  assert.equal(options.family, 6)
  assert.equal(options.connectionName, 'clipboard')
  assert.equal(typeof options.tls, 'object')
})

test('supports a database supplied through URL query options', () => {
  assert.equal(redisOptionsFromUrl('redis://localhost?db=4').db, 4)
})

test('malformed URLs produce sanitized errors', () => {
  for (const value of [
    'not-a-url:secret',
    'https://user:secret@example.com',
    'redis://user:secret@example.com:99999',
    'redis://user:secret@example.com/-1',
    'redis://user:secret@example.com/0?db=1&family=5',
    'redis://user:secret%ZZ@example.com',
  ]) {
    assert.throws(() => redisOptionsFromUrl(value), (error) => {
      assert.equal(error.message, 'REDIS_URL must be a valid redis:// or rediss:// connection URL')
      assert.doesNotMatch(error.message, /secret/)
      return true
    })
  }
})

test('the real ioredis client initializes without calling the legacy URL parser', () => {
  const originalParse = url.parse
  let client
  url.parse = () => { throw new Error('Deprecated url.parse was called') }
  try {
    client = new Redis({ ...redisOptionsFromUrl('rediss://default:p%40ss@localhost:6380/2'), lazyConnect: true })
    assert.equal(client.options.host, 'localhost')
    assert.equal(client.options.password, 'p@ss')
    assert.equal(client.options.db, 2)
    assert.equal(typeof client.options.tls, 'object')
  } finally {
    url.parse = originalParse
    client?.disconnect()
  }
})

test('the clipboard storage adapter also passes parsed options to Redis', () => {
  let connectionOptions
  class MockRedis {
    constructor(options) { connectionOptions = options }
    on() {}
  }
  loadTypeScript(path.join(__dirname, '../lib/kv.ts'), {
    process: { env: { REDIS_URL: 'redis://default:password@example.com:16434' } },
    console: { log() {} },
    require: (name) => {
      if (name === 'ioredis') return MockRedis
      if (name === './redis-options') return optionsModule
      throw new Error(`Unexpected import: ${name}`)
    },
  })
  assert.equal(typeof connectionOptions, 'object')
  assert.equal(connectionOptions.host, 'example.com')
  assert.equal(connectionOptions.port, 16434)
  assert.equal(connectionOptions.password, 'password')
})
