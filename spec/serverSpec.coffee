rewire = require 'rewire'

describe 'Server', ->
  Server = undefined

  describe 'Without parameter case', ->
    testObj = undefined
    Proxy = undefined
    Io = undefined
    onFn = undefined

    beforeEach ->
      Server = rewire('../src/server')
      Proxy = () ->
        @server = jasmine.createSpyObj 'server', ['on']
        @
      onFn = jasmine.createSpy 'on'
      Io = ->
        @of = ->
          @on = onFn
          @off = ->
          @
        @

      Server.__set__ 'Proxy', Proxy
      Server.__set__ 'Io', Io
      testObj = Server()
      return

    it 'should build an object', ->
      expect(testObj).toBeDefined()

    it 'should subcribe the "error" event', ->
      expect(server.on.calls.first().args[0]).toEqual("error")

    it 'should subcribe the "connection" event on socket the object', ->
      expect(onFn.calls.first().args[0]).toEqual("connection")
