// var lodash = require('lodash')
import package_info from '../package.json'
import DemoFileDump from './dump'

module.exports = {
  dump () {
    // TODO do the thing
    return DemoFileDump
  },
  version: package_info.version,
  parse () {
    // TODO literally all the work
    return 2
  }
}
