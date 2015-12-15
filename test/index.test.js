/* global describe, it */
import {expect} from 'chai'
import demoInfo from '../dist/index'

describe('csgo-demo-info', () => {
  it('should work', () => {
    expect(demoInfo.version).to.be.a('string')
  })
})
