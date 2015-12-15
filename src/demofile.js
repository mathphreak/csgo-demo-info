import Promise from 'bluebird'
import fs from 'fs'
Promise.promisifyAll(fs)

const DEMO_HEADER_ID = 'HL2DEMO'
const DEMO_PROTOCOL = 4
const MAX_OSPATH = 260
const DEMO_HEADER_SIZE = 32 + 4 * MAX_OSPATH
const FDEMO = {
  NORMAL: 0,
  USE_ORIGIN2: (1 << 0),
  USE_ANGLES2: (1 << 1),
  NOINTERP: (1 << 2)
}

class Vector {
  constructor () {
    this.x = this.y = this.z = 0.0
  }
  ReadFrom (buf) {
    var pos = 0
    this.x = buf.readFloatLE(pos)
    pos += 4
    this.y = buf.readFloatLE(pos)
    pos += 4
    this.z = buf.readFloatLE(pos)
    pos += 4
  }
}

Vector.size = 3 * 4

class QAngle {
  constructor () {
    this.x = this.y = this.z = 0.0
  }
  ReadFrom (buf) {
    var pos = 0
    this.x = buf.readFloatLE(pos)
    pos += 4
    this.y = buf.readFloatLE(pos)
    pos += 4
    this.z = buf.readFloatLE(pos)
    pos += 4
  }
}

QAngle.size = 3 * 4

class Split {
  constructor () {
    this.flags = FDEMO.NORMAL
    this.viewOrigin = new Vector()
    this.viewAngles = new QAngle()
    this.localViewAngles = new QAngle()
    this.viewOrigin2 = new Vector()
    this.viewAngles2 = new QAngle()
    this.localViewAngles2 = new QAngle()
  }
  GetViewOrigin () {
    if (this.flags & FDEMO.USE_ORIGIN2) {
      return this.viewOrigin2
    }
    return this.viewOrigin
  }
  GetViewAngles () {
    if (this.flags & FDEMO.USE_ANGLES2) {
      return this.viewAngles2
    }
    return this.viewAngles
  }
  GetLocalViewAngles () {
    if (this.flags & FDEMO.USE_ANGLES2) {
      return this.localViewAngles2
    }
    return this.localViewAngles
  }
  Reset () {
    this.flags = 0
    this.viewOrigin2 = this.viewOrigin
    this.viewAngles2 = this.viewAngles
    this.localViewAngles2 = this.localViewAngles
  }
  ReadFrom (buf) {
    var pos = 0
    this.flags = buf.readInt32LE(pos)
    pos += 4
    this.viewOrigin.ReadFrom(buf.slice(pos, pos + Vector.size))
    pos += Vector.size
    this.viewAngles.ReadFrom(buf.slice(pos, pos + QAngle.size))
    pos += QAngle.size
    this.localViewAngles.ReadFrom(buf.slice(pos, pos + QAngle.size))
    pos += QAngle.size
    this.viewOrigin2.ReadFrom(buf.slice(pos, pos + Vector.size))
    pos += Vector.size
    this.viewAngles2.ReadFrom(buf.slice(pos, pos + QAngle.size))
    pos += QAngle.size
    this.localViewAngles2.ReadFrom(buf.slice(pos, pos + QAngle.size))
    pos += QAngle.size
  }
}

Split.size = 4 + 2 * Vector.size + 4 * QAngle.size

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
  nextInt32 () {
    var result = this.fileBuffer.readInt32LE(this.fileBufferPos)
    this.fileBufferPos += 4
    return result
  }
  nextUChar () {
    var result = this.fileBuffer.readUInt8(this.fileBufferPos)
    this.fileBufferPos++
    return result
  }
  nextSlice (len) {
    var result = this.fileBuffer.slice(this.fileBufferPos, this.fileBufferPos + len)
    this.fileBufferPos += len
    return result
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
    this.fileBufferPos = 0
    this.fileBuffer = {}
  }
  ReadRawData () {
    var size = this.nextInt32()
    var buf = this.nextSlice(size)
    return buf
  }
  ReadSequenceInfo () {
    var seqIn = this.nextInt32()
    var seqOut = this.nextInt32()
    return {seqIn, seqOut}
  }
  ReadCmdInfo () {
    var data = [new Split(), new Split()]
    data[0].ReadFrom(this.nextSlice(Split.size))
    data[1].ReadFrom(this.nextSlice(Split.size))
    return {u: data}
  }
  ReadCmdHeader () {
    var cmd = this.nextUChar()
    // TODO validate command
    var tick = this.nextInt32()
    var playerSlot = this.nextUChar()
    return {
      cmd, tick, playerSlot
    }
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

var commands = {
  signon: 1,
  packet: 2,
  synctick: 3,
  consolecmd: 4,
  usercmd: 5,
  datatables: 6,
  stop: 7,
  customdata: 8,
  stringtables: 9,
  lastcmd: 9
}

module.exports = DemoFile
module.exports.commands = commands
