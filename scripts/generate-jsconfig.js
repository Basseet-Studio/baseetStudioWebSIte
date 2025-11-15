const fs = require('fs')
const path = require('path')

const content = {
  compilerOptions: {
    baseUrl: '.',
    paths: {
      '*': ['./*'],
    },
  },
}

const destDir = path.join(__dirname, '..', 'assets')
const destFile = path.join(destDir, 'jsconfig.json')

fs.mkdirSync(destDir, { recursive: true })
fs.writeFileSync(destFile, JSON.stringify(content, null, 2) + '\n')
console.log(`Generated ${destFile}`)
