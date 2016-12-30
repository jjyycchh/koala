Helper = require('hubot-test-helper')
chai = require 'chai'

expect = chai.expect

helper = new Helper('../scripts/example.coffee')

describe 'example script', ->
  beforeEach ->
    @room = helper.createRoom()

  afterEach ->
    @room.destroy()

  it 'doesn\'t need badgers', ->
    @room.user.say('alice', 'did someone call for a badger?').then =>
      expect(@room.messages).to.eql [
        ['alice', 'did someone call for a badger?']
        ['hubot', 'Badgers? BADGERS? WE DON\'T NEED NO STINKIN BADGERS']
      ]

  it 'won\'t open the pod bay doors', ->
    @room.user.say('bob', '@hubot open the pod bay doors').then =>
      expect(@room.messages).to.eql [
        ['bob', '@hubot open the pod bay doors']
        ['hubot', '@bob I\'m afraid I can\'t let you do that.']
      ]

  it 'will open the dutch doors', ->
    @room.user.say('bob', '@hubot open the dutch doors').then =>
      expect(@room.messages).to.eql [
        ['bob', '@hubot open the dutch doors']
        ['hubot', '@bob Opening dutch doors']
      ]