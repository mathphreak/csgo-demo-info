import package_info from '../package.json'
import DemoFileDump from './dump'

module.exports = {
  dump (demoFile, outputFile, options) {
    var dump = new DemoFileDump(options)
    return dump
      .Open(demoFile)
      .then(() => dump.DoDump(outputFile))
  },
  version: package_info.version,
  parse () {
    // TODO literally all the work
    return 2
  }
}
