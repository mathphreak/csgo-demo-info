class DemoFile {
  constructor () {
    this.demoHeader = {}
    this.fileName = ''
    this.fileBufferPos = 0
    this.fileBuffer = {}
  }
  Open (filename) {
    throw new Error('NYI')
  }
  Close () {
    throw new Error('NYI')
  }
  ReadRawData () {
    throw new Error('NYI')
  }
  ReadSequenceInfo () {
    throw new Error('NYI')
  }
  ReadCmdInfo () {
    throw new Error('NYI')
  }
  ReadCmdHeader () {
    throw new Error('NYI')
  }
  ReadUserCmd () {
    throw new Error('NYI')
  }
  ReadDemoHeader () {
    throw new Error('NYI')
  }
}

module.exports = DemoFile
