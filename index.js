var fs = require('fs-extra')

exports.readSync = readSync
function readSync (dir) {
  var obj = {}
  var entries = fs.readdirSync(dir).sort()
  for (var i = 0; i < entries.length; i++) {
    var entry = entries[i]
    var fullPath = dir + '/' + entry
    var stats = fs.statSync(fullPath) // stat, unlike lstat, follows symlinks
    if (stats.isFile()) {
      obj[entry] = fs.readFileSync(fullPath, { encoding: 'utf8' })
    } else if (stats.isDirectory()) {
      obj[entry] = readSync(fullPath)
    } else {
      throw new Error('Stat\'ed ' + fullPath + ' but it is neither file, symlink, nor directory')
    }
  }
  return obj
}

exports.writeSync = writeSync
function writeSync (dir, obj) {
  fs.mkdirpSync(dir);

  if ('string' !== typeof dir || dir === '') {
    throw new TypeError('writeSync first argument must be a non-empty string')
  }

  if ('object' !== typeof obj && obj !== null) {
    throw new TypeError('writeSync second argument must be an object')
  }

  for (var entry in obj) {
    if (obj.hasOwnProperty(entry)) {
      if ('string' !== typeof entry || entry === '') {
        throw new Error('Directory entry must be a non-empty string')
      }
      if (entry === '.' || entry === '..') {
        throw new Error('Directory entry must not be "." or ".."')
      }
      if (entry.indexOf('/') !== -1 || entry.indexOf('\\') !== -1) {
        throw new Error('Directory entry must not contain "/" or "\\"')
      }
      var fullPath = dir + '/' + entry
      var value = obj[entry]
      var stat;

      try {
        stat = fs.statSync(fullPath);
      } catch (e) {}

      if (typeof value === 'string') {
        if (stat && stat.isDirectory()) {
          fs.removeSync(fullPath)
        }

        fs.writeFileSync(fullPath, value, 'UTF8')
      } else if (typeof value === 'object') {
        if (value === null) {
          fs.removeSync(fullPath)
        } else {
          try {
            if (stat && stat.isFile()) {
              fs.unlinkSync(fullPath)
            }
            fs.mkdirSync(fullPath)
          } catch (e) {
            // if the directory already exists, carry on.
            // This is to support, re-appling (append-only) of fixtures
            if (!(typeof e === 'object' && e !== null && e.code === 'EEXIST')) {
              throw e
            }
          }
          writeSync(fullPath, value)
        }
      } else {
        throw new Error(entry + ' in ' + dir + ': Expected string or object, got ' + value)
      }
    }
  }
}
