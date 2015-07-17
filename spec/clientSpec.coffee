rewire = require 'rewire'

describe 'Client', ->

  describe 'server listening binding', ->
    Client = require '../src/client'

    it 'should build an object', ->
      server = jasmine.createSpyObj 'server', ['on', 'off']
      testObj = Client(server)
      expect(testObj).toBeDefined()

    it 'should subcribe the "listening" event', ->
      server = jasmine.createSpyObj 'server', ['on', 'off']
      testObj = Client(server)
      expect(server.on.calls.first().args[0]).toEqual("listening")
