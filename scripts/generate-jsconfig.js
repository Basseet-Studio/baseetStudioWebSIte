const fs = require('fs')
const path = require('path')

const content = {
  compilerOptions: {
    baseUrl: '.',
    paths: {
      '*': ['./*'],
    },
    // Ensure JS runtime globals (Promise, Map, etc) are available in editor
    lib: ['ES2019', 'DOM'],
    allowJs: true,
    checkJs: false,
  },
  exclude: ['node_modules', 'public', 'resources', '.hugo_build.lock'],
}

const destDir = path.join(__dirname, '..', 'assets')
const destFile = path.join(destDir, 'jsconfig.json')

fs.mkdirSync(destDir, { recursive: true })
fs.writeFileSync(destFile, JSON.stringify(content, null, 2) + '\n')
console.log(`Generated ${destFile}`)
