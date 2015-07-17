var EVENTS, ProxyClient, _r, bindSocketSubscriber, getSystemAddresses, io, mazehallGridRegister;

_r = require('kefir');

io = require('socket.io-client');

EVENTS = require('./events');

ProxyClient = function(server, hosts) {
  server.on('listening', function() {
    return bindSocketSubscriber(server, hosts);
  });
  return this;
};

bindSocketSubscriber = function(server, hosts) {
  var socket;
  socket = io.connect(process.env.MAZEHALL_PROXY_MASTER || 'ws://localhost:3300/proxy');
  socket.on(EVENTS.HELLO, function() {
    return mazehallGridRegister(server, socket, hosts);
  });
  socket.on(EVENTS.MESSAGE, function(x) {
    return console.log('proxy-message: ' + x);
  });
  socket.on(EVENTS.ERROR, function(err) {
    return console.error(err);
  });
  socket.on('connect_timeout', function() {
    return console.log('proxy-connection: timeout');
  });
  socket.on('reconnect_failed', function() {
    return console.log('proxy-connection: couldn’t reconnect within reconnectionAttempts');
  });
};

module.exports = ProxyClient;


/*
  helper
 */

getSystemAddresses = function() {
  var address, addresses, interfaces, k, k2, os;
  os = require('os');
  interfaces = os.networkInterfaces();
  addresses = [];
  for (k in interfaces) {
    for (k2 in interfaces[k]) {
      address = interfaces[k][k2];
      if (address.family === 'IPv4' && !address.internal) {
        addresses.push(address.address);
      }
    }
  }
  return addresses;
};

mazehallGridRegister = function(server, socket, hosts) {
  var addresses, port;
  port = server.address().port;
  addresses = getSystemAddresses();
  hosts = hosts || ['localhost'];
  if (!Array.isArray(hosts)) {
    hosts = [hosts];
  }
  return hosts.forEach(function(host) {
    var msg;
    msg = {
      target: host,
      port: port,
      addresses: addresses
    };
    return socket.emit(EVENTS.REGISTER, msg);
  });
};
