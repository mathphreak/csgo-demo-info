import demoInfo from './index'

// TODO be less terrible

console.log('Dumping info from', process.argv[2], 'to', process.argv[3])
demoInfo.dump(process.argv[2], process.argv[3], {
  dumpGameEvents: true,
  suppressFootstepEvents: false,
  showExtraPlayerInfoInGameEvents: true,
  dumpDeaths: true,
  supressWarmupDeaths: false,
  dumpStringTables: true,
  dumpDataTables: true,
  dumpPacketEntities: true,
  dumpNetMessages: true
})
