/* global describe, it */

var expect = require('chai').expect
var demoInfo = require('./index')

describe('csgo-demo-info', function () {
  it('should work', function () {
    expect(demoInfo.version).to.be.a('string')
  })
})
