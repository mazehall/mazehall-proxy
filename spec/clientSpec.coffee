rewire = require 'rewire'

describe 'Client', ->

  describe 'server listening binding', ->
    Client = require '../src/client'
    testObj = undefined
    server = undefined

    beforeEach ->
      server = jasmine.createSpyObj 'server', ['on', 'off']
      testObj = Client(server)
      return

    it 'should build an object', ->
      expect(testObj).toBeDefined()

    it 'should subcribe the "listening" event', ->
      expect(server.on.calls.first().args[0]).toEqual("listening")
