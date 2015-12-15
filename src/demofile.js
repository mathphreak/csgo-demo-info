import Promise from 'bluebird'
import fs from 'fs'
Promise.promisifyAll(fs)

const DEMO_HEADER_ID = 'HL2DEMO'
const DEMO_PROTOCOL = 4
const MAX_OSPATH = 260
const DEMO_HEADER_SIZE = 32 + 4 * MAX_OSPATH

class DemoFile {
  constructor () {
    this.demoHeader = {
      demofilestamp: '',
      demoprotocol: 0,
      networkprotocol: 0,
      servername: '',
      clientname: '',
      mapname: '',
      gamedirectory: '',
      playback_time: 0.0,
      playback_ticks: 0,
      playback_frames: 0,
      signonlength: 0
    }
    this.fileName = ''
    this.fileBufferPos = 0
    this.fileBuffer = {}
  }
  Open (filename) {
    this.Close()
    return fs.readFileAsync(filename)
      .then((fileContents) => {
        // Read the demo header
        this.ReadDemoHeader(fileContents.slice(0, DEMO_HEADER_SIZE))
        if (this.demoHeader.demofilestamp !== DEMO_HEADER_ID) {
          throw new Error('Bad header ID',
            'found ' + this.demoHeader.demofilestamp +
            ' but expected ' + DEMO_HEADER_ID)
        }
        if (this.demoHeader.demoprotocol !== DEMO_PROTOCOL) {
          throw new Error('Bad demo file protocol',
            'found ' + this.demoHeader.demoprotocol +
            ' but expected ' + DEMO_PROTOCOL)
        }
        this.fileBuffer = fileContents.slice(DEMO_HEADER_SIZE)
        this.fileBufferPos = 0
        this.fileName = filename
      })
  }
  Close () {
    this.fileName = ''
    this.fileBufferPos = ''
    this.fileBuffer = {}
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
  ReadDemoHeader (data) {
    this.demoHeader.demofilestamp = data.toString('ascii', 0, 8).replace(/\u0000/g, '')
    this.demoHeader.demoprotocol = data.readInt32LE(8)
    this.demoHeader.networkprotocol = data.readInt32LE(12)
    this.demoHeader.servername = data.toString('ascii', 16, 16 + MAX_OSPATH).replace(/\u0000/g, '')
    this.demoHeader.clientname = data.toString('ascii', 16 + MAX_OSPATH, 16 + 2 * MAX_OSPATH).replace(/\u0000/g, '')
    this.demoHeader.mapname = data.toString('ascii', 16 + 2 * MAX_OSPATH, 16 + 3 * MAX_OSPATH).replace(/\u0000/g, '')
    this.demoHeader.gamedirectory = data.toString('ascii', 16 + 3 * MAX_OSPATH, 16 + 4 * MAX_OSPATH).replace(/\u0000/g, '')
    this.demoHeader.playback_time = data.readFloatLE(16 + 4 * MAX_OSPATH)
    this.demoHeader.playback_ticks = data.readInt32LE(20 + 4 * MAX_OSPATH)
    this.demoHeader.playback_frames = data.readInt32LE(24 + 4 * MAX_OSPATH)
    this.demoHeader.signonlength = data.readInt32LE(28 + 4 * MAX_OSPATH)
  }
}

module.exports = DemoFile
