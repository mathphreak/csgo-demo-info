/* global describe, it */
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import DemoFile from '../dist/demofile'
chai.use(chaiAsPromised)

var expect = chai.expect

describe('DemoFile', () => {
  it('should read a header properly', () => {
    var file = new DemoFile()
    var promise = file.Open('test/BotTestDemo.dem').catch((err) => {
      // The error is not actually logged in a useful way when something goes wrong in Open()
      console.error(err)
      throw err
    }).then(() => {
      expect(file.demoHeader.clientname).to.equal('mathphreak')
      expect(file.demoHeader.mapname).to.equal('de_dust2')
    })
    expect(promise).to.be.fulfilled
  })
})
