_r = require 'Kefir'
Io = require 'socket.io'
http = require 'http'
Proxy = require 'redbird'

testConnection = (target, cb) ->
  http.get(target, (res) ->
    res.on 'data', ->
    res.on 'end', ->
      cb null, res.statusCode)
  .on 'error', (err) ->
    cb err
  return

msgValidation = (msg) ->
  vdtn =
    err: null
    valid: false
  if (!msg.target || !msg.port || !msg.addresses)
    vdtn.err = new Error 'validation failed: required keys "target","port","addresses"'
  else if (!Array.isArray(msg.addresses))
    vdtn.err = new Error 'addresses must be an array'
  else
    vdtn.valid = true
  vdtn


unregisterListener = (socket, proxy) ->
  _r.fromEvent socket, 'disconnect'
  .onValue () ->
    socket.mazehallProxy = socket.mazehallProxy || []
    proxy.unregister item.target, item.backend for item in socket.mazehallProxy


registerListener = (socket, proxy) ->
  _r.fromEvent socket, MazehallProxy.REGISTER
  .filter()
  .valuesToErrors (msg) ->
    validation = msgValidation msg
    {convert: !validation.valid, error: validation.err}
  .map (msg) ->
    msg.target.host = msg.target.host || 'localhost';
    msg.target.path = msg.target.path || '/';
    return msg
  #    target: {
  #      host: host,
  #      path: path
  #    },
  #    port: port,
  #    addresses: []
  .map (x) ->
    offers = []
    offers.push {
      backend: {
        host: address,
        port: x.port
      },
      target: x.target
    } for address in x.addresses
    offers
  .filter()
  .flatMap (offers) ->
    _r.constant(offers)
    .flatten()
    .flatMap (offer) ->
      _r.fromNodeCallback (cb) -> testConnection offer.backend, cb
      .filter (status) ->
        status < 500
      .map (res) ->
        offer
    .take 1

  .onValue (conn) ->
    socket.mazehallProxy ?= []
    target = conn.target.host + conn.target.path
    backend = conn.backend
    console.log target
    proxy.register target, backend
    socket.mazehallProxy.push {target: target, backend: backend}
    socket.emit MazehallProxy.MESSAGE, 'registered connection: ' + JSON.stringify(target) + ' -> ' + JSON.stringify(backend)
  .onError (err) ->
    socket.emit MazehallProxy.ERROR, err.message || JSON.stringify err


class MazehallProxy
  @HELLO: 'MAZEHALL:PROXY:HELLO'
  @REGISTER: 'MAZEHALL:PROXY:REGISTER'
  @MESSAGE: 'MAZEHALL:PROXY:MESSAGE'
  @ERROR: 'MAZEHALL:PROXY:ERROR'
  @proxy

  constructor: (opts) ->
    return new MazehallProxy(opts) unless @ instanceof MazehallProxy
    opts = opts || {}
    opts.port = process.env.MAZEHALL_PROXY_PORT || opts.port || 8080
    opts.bunyan = process.env.MAZEHALL_PROXY_LOG || opts.bunyan || false

    opts.mazehall = opts.mazehall || {}
    opts.mazehall.ns = process.env.MAZEHALL_SOCKET_NS || opts.mazehall.ns || '/proxy'
    opts.mazehall.port = process.env.MAZEHALL_SOCKET_PORT || opts.mazehall.port || 3300

    MazehallProxy.proxy = Proxy(opts)
    MazehallProxy.proxy.server.on 'error', (err) ->
      console.log('proxy-server ' + err)

    io = Io(opts.mazehall.port)
    ioNs = io.of(opts.mazehall.ns)
    @connectionListener ioNs
    return


  connectionListener: (ns) ->
    @sockets_ = _r.fromEvent(ns, 'connection')
    .onValue (socket) ->
      socket.emit MazehallProxy.HELLO

      registerListener socket, MazehallProxy.proxy
      unregisterListener socket, MazehallProxy.proxy



module.exports = MazehallProxy