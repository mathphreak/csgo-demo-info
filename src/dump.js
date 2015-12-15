class DemoFileDump {
  constructor (options) {
    this.options = options
    this.frameNumber = 0
    this.demofile = {}
    this.gameEventList = {}
  }
  Open (filename) {
    return this.demofile.Open(filename)
      .catch((err) => {
        console.err('Error opening file', filename, 'due to error', err)
      })
  }
  DoDump () {
    let demofinished = false
    while (!demofinished) {
      var {cmd, tick, playerSlot} = this.demofile.ReadCmdHeader()
      console.log(cmd, tick, playerSlot)
    }
  }
  HandleDemoPacket () {
    // TODO
  }
  DumpDemoPacket (buf) {
    // TODO
  }
  DumpUserMessage (buf) {
    // TODO
  }
  MsgPrintf (msg, size, fmt) {
    // TODO
  }
}

module.exports = DemoFileDump
