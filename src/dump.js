import DemoFile from './demofile'
import {CBitRead} from './bitbuf'
import {CSVCMsg_SendTable} from './messages'

const NET_MAX_PAYLOAD = 262144 - 4

var globalOptions

var s_DataTables
var s_ServerClasses
var s_nServerClassBits

function ReadFromBuffer (buffer) {
  var size = buffer.ReadVarInt32()
  var pBuffer // output buffer
  if (size < 0 || size > NET_MAX_PAYLOAD) {
    return false
  }

  // Check its valid
  if (size > buffer.GetNumBytesLeft()) {
    return false
  }

  // If the read buffer is byte aligned, we can parse right out of it
  // but can we really?
  /*
  if ((buffer.GetNumBitsRead() % 8) === 0) {
    pBuffer = buffer.FakeMemcpySlice(buffer.GetNumBytesRead(), size)
    // memcpy(pBuffer, buffer.GetBasePointer() + buffer.GetNumBytesRead(), size)
    buffer.SeekRelative(size * 8)
    return true
  }
  */

  // otherwise we have to ReadBytes() it out
  pBuffer = buffer.ReadBytes(size)
  if (pBuffer.length === 0) {
    return false
  }

  return true
}

function RecvTable_ReadInfos () {
  throw new Error('RecvTable_ReadInfos NYI')
}

function FlattenDataTable () {
  throw new Error('FlattenDataTable NYI')
}

function ParseDataTable (buf) {
  var msg
  while (1) {
    buf.ReadVarInt32()

    var pBuffer = null // void *
    pBuffer = ReadFromBuffer(buf)
    if (!pBuffer) {
      console.error('ParseDataTable: ReadFromBuffer failed.\n')
      return false
    }
    msg = CSVCMsg_SendTable.decode(pBuffer)

    if (msg.is_end()) {
      break
    }

    RecvTable_ReadInfos(msg)

    s_DataTables.push_back(msg)
  }

  var nServerClasses = buf.ReadShort() // short
  // TODO: assert nServerClasses > 0
  for (let i = 0; i < nServerClasses; i++) {
    var entry // ServerClass_t
    entry.nClassID = buf.ReadShort()
    if (entry.nClassID >= nServerClasses) {
      console.error('ParseDataTable: invalid class index (%d).\n', entry.nClassID)
      return false
    }

    var nChars // int
    buf.ReadString(entry.strName, false, nChars)
    buf.ReadString(entry.strDTName, false, nChars)

    // find the data table by name
    entry.nDataTable = -1
    for (let j = 0; j < s_DataTables.size(); j++) { // unsigned int
      if (entry.strDTName === s_DataTables[ j ].net_table_name().c_str()) {
        entry.nDataTable = j
        break
      }
    }

    if (globalOptions.dumpDataTables) {
      console.log('class:%d:%s:%s(%d)\n', entry.nClassID, entry.strName, entry.strDTName, entry.nDataTable)
    }
    s_ServerClasses.push_back(entry)
  }

  if (globalOptions.dumpDataTables) {
    console.log('Flattening data tables...')
  }
  for (let i = 0; i < nServerClasses; i++) { // int
    FlattenDataTable(i)
  }
  if (globalOptions.dumpDataTables) {
    console.log('Done.\n')
  }

  // perform integer log2() to set s_nServerClassBits
  var nTemp = nServerClasses // int
  s_nServerClassBits = 0
  while ((nTemp >>= 1) > 0) {
    ++s_nServerClassBits
  }

  s_nServerClassBits++

  return true
}

class DemoFileDump {
  constructor (options) {
    globalOptions = options
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
      switch (cmd) {
        case DemoFile.commands.synctick:
          break
        case DemoFile.commands.stop:
          demofinished = true
          break
        case DemoFile.commands.consolecmd:
          this.demofile.ReadRawData(null, 0)
          break
        case DemoFile.commands.datatables:
          var data = this.demofile.ReadRawData()
          var fancyBuffer = new CBitRead(data)
          if (!ParseDataTable(fancyBuffer)) {
            console.error('Error parsing data tables.')
          }
          break
        case DemoFile.commands.stringtables:
          throw new Error('String tables NYI')
        case DemoFile.commands.usercmd:
          this.demofile.ReadUserCmd(null)
          break
        case DemoFile.commands.signon:
        case DemoFile.commands.packet:
          this.HandleDemoPacket()
          break
        default:
          break
      }
      console.log(cmd, tick, playerSlot)
    }
  }
  HandleDemoPacket () {
    this.demofile.ReadCmdInfo()
    this.demofile.ReadSequenceInfo()

    var data = this.demofile.ReadRawData()
    var fancyBuffer = new CBitRead(data)
    this.DumpDemoPacket(fancyBuffer, data.length)
  }
  DumpDemoPacket (data, length) {
    while (data.GetNumBytesRead() < data.length) {
      var Cmd = data.ReadVarInt32()
      console.log(Cmd)
      throw new Error('DumpDemoPacket NYI')
    }
  }
  DumpUserMessage (buf) {
    throw new Error('NYI')
  }
  MsgPrintf (msg, size, fmt) {
    throw new Error('NYI')
  }
}

module.exports = DemoFileDump
