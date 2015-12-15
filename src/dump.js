import DemoFile from './demofile'

class DemoFileDump {
  constructor (options) {
    this.options = options
    this.frameNumber = 0
    this.demofile = new DemoFile()
    this.gameEventList = {}
  }
  Open (filename) {
    return this.demofile.Open(filename)
      .catch((err) => {
        console.error('Error opening file', filename, 'due to error', err)
        throw err
      })
  }
  DoDump (filename) {
    let demofinished = false
    while (!demofinished) {
      var {cmd, tick, playerSlot} = this.demofile.ReadCmdHeader()
      console.log(cmd, tick, playerSlot)
    }
  }
  HandleDemoPacket () {
    throw new Error('NYI')
  }
  DumpDemoPacket (buf) {
    throw new Error('NYI')
  }
  DumpUserMessage (buf) {
    throw new Error('NYI')
  }
  MsgPrintf (msg, size, fmt) {
    throw new Error('NYI')
  }
}

module.exports = DemoFileDump
