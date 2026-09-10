const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const { createRequire } = require('node:module')
const ts = require('typescript')

// Execute the actual TypeScript module with injectable dependencies, using the
// compiler already installed in this project instead of a separate TS runtime.
module.exports = function loadTypeScript(filename, globals = {}) {
  const absolutePath = path.resolve(filename)
  const code = ts.transpileModule(fs.readFileSync(absolutePath, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
  }).outputText
  const module = { exports: {} }
  vm.runInNewContext(code, {
    module,
    exports: module.exports,
    require: createRequire(absolutePath),
    URL,
    ...globals,
  }, { filename: absolutePath })
  return module.exports
}
