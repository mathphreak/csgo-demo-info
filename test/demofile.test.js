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
      console.error(err)
      throw err
    })
    expect(promise).to.be.fulfilled
  })
})
