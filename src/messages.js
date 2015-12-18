import protobuf from 'protocol-buffers'
import fs from 'fs'
import path from 'path'

var thisPath = module.filename
var thisDir = path.dirname(thisPath)
var proto1Path = path.join(thisDir, 'netmessages_public.proto')
var proto2Path = path.join(thisDir, 'cstrike15_usermessages_public.proto')

var messages = protobuf(fs.readFileSync(proto1Path) + fs.readFileSync(proto2Path))

module.exports = messages
