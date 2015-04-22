var EVENTS, ProxyClient, _r, getSystemAddresses, logStream_, mazehallGridRegister;

_r = require('kefir');

EVENTS = require('./events');

logStream_ = _r.bus();

ProxyClient = function(server, hosts) {
  _r.fromEvent(server, 'listening').onValue(function() {
    var io, socket;
    io = require('socket.io-client');
    socket = io.connect(process.env.MAZEHALL_PROXY_MASTER || 'ws://localhost:3300/proxy');
    socket.on('connect', function() {
      return logStream_.emit('mazehall-proxy socket connected');
    });
    socket.on(EVENTS.HELLO, function() {
      return mazehallGridRegister(server, socket, hosts);
    });
    socket.on(EVENTS.MESSAGE, function(x) {
      return logStream_.emit('message: ' + x);
    });
    return socket.on(EVENTS.ERROR, function(err) {
      return logStream_.error(err);
    });
  });
  return logStream_;
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
