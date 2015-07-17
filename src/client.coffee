_r = require 'kefir'
io = require 'socket.io-client'
EVENTS = require './events'

ProxyClient = (server, hosts) ->
  server.on 'listening', ->
    bindSocketSubscriber server, hosts
  @

bindSocketSubscriber = (server, hosts) ->
  socket = io.connect process.env.MAZEHALL_PROXY_MASTER || 'ws://localhost:3300/proxy'
  socket.on EVENTS.HELLO, ->
    mazehallGridRegister server, socket, hosts
  socket.on EVENTS.MESSAGE, (x) ->
    console.log 'proxy-message: ' + x
  socket.on EVENTS.ERROR, (err) ->
    console.error err
  socket.on 'connect_timeout', ->
    console.log 'proxy-connection: timeout'
  socket.on 'reconnect_failed', ->
    console.log 'proxy-connection: couldn’t reconnect within reconnectionAttempts'
  return

module.exports = ProxyClient


###
  helper
###
getSystemAddresses = ->
  os = require('os')
  interfaces = os.networkInterfaces()
  #console.log interfaces
  addresses = []
  for k of interfaces
    for k2 of interfaces[k]
      address = interfaces[k][k2];
      if (address.family == 'IPv4' && !address.internal)
        addresses.push address.address
  addresses


mazehallGridRegister = (server, socket, hosts) ->
  port = server.address().port
  addresses = getSystemAddresses()
  hosts = hosts || ['localhost']
  hosts = [hosts] unless Array.isArray hosts
  hosts.forEach (host) ->
    msg =
      target: host,
      port: port,
      addresses: addresses
    socket.emit EVENTS.REGISTER, msg
