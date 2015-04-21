var Io, MazehallProxy, Proxy, _r, http, msgValidation, registerListener, testConnection, unregisterListener;

_r = require('Kefir');

Io = require('socket.io');

http = require('http');

Proxy = require('redbird');

testConnection = function(target, cb) {
  http.get(target, function(res) {
    res.on('data', function() {});
    return res.on('end', function() {
      return cb(null, res.statusCode);
    });
  }).on('error', function(err) {
    return cb(err);
  });
};

msgValidation = function(msg) {
  var vdtn;
  vdtn = {
    err: null,
    valid: false
  };
  if (!msg.target || !msg.port || !msg.addresses) {
    vdtn.err = new Error('validation failed: required keys "target","port","addresses"');
  } else if (!Array.isArray(msg.addresses)) {
    vdtn.err = new Error('addresses must be an array');
  } else {
    vdtn.valid = true;
  }
  return vdtn;
};

unregisterListener = function(socket, proxy) {
  return _r.fromEvent(socket, 'disconnect').onValue(function() {
    var i, item, len, ref, results;
    socket.mazehallProxy = socket.mazehallProxy || [];
    ref = socket.mazehallProxy;
    results = [];
    for (i = 0, len = ref.length; i < len; i++) {
      item = ref[i];
      results.push(proxy.unregister(item.target, item.backend));
    }
    return results;
  });
};

registerListener = function(socket, proxy) {
  return _r.fromEvent(socket, MazehallProxy.REGISTER).filter().valuesToErrors(function(msg) {
    var validation;
    validation = msgValidation(msg);
    return {
      convert: !validation.valid,
      error: validation.err
    };
  }).map(function(msg) {
    msg.target.host = msg.target.host || 'localhost';
    msg.target.path = msg.target.path || '/';
    return msg;
  }).map(function(x) {
    var address, i, len, offers, ref;
    offers = [];
    ref = x.addresses;
    for (i = 0, len = ref.length; i < len; i++) {
      address = ref[i];
      offers.push({
        backend: {
          host: address,
          port: x.port
        },
        target: x.target
      });
    }
    return offers;
  }).filter().flatMap(function(offers) {
    return _r.constant(offers).flatten().flatMap(function(offer) {
      return _r.fromNodeCallback(function(cb) {
        return testConnection(offer.backend, cb);
      }).filter(function(status) {
        return status < 500;
      }).map(function(res) {
        return offer;
      });
    }).take(1);
  }).onValue(function(conn) {
    var backend, target;
    if (socket.mazehallProxy == null) {
      socket.mazehallProxy = [];
    }
    target = conn.target.host + conn.target.path;
    backend = conn.backend;
    console.log(target);
    proxy.register(target, backend);
    socket.mazehallProxy.push({
      target: target,
      backend: backend
    });
    return socket.emit(MazehallProxy.MESSAGE, 'registered connection: ' + JSON.stringify(target) + ' -> ' + JSON.stringify(backend));
  }).onError(function(err) {
    return socket.emit(MazehallProxy.ERROR, err.message || JSON.stringify(err));
  });
};

MazehallProxy = (function() {
  MazehallProxy.HELLO = 'MAZEHALL:PROXY:HELLO';

  MazehallProxy.REGISTER = 'MAZEHALL:PROXY:REGISTER';

  MazehallProxy.MESSAGE = 'MAZEHALL:PROXY:MESSAGE';

  MazehallProxy.ERROR = 'MAZEHALL:PROXY:ERROR';

  MazehallProxy.proxy;

  function MazehallProxy(opts) {
    var io, ioNs;
    if (!(this instanceof MazehallProxy)) {
      return new MazehallProxy(opts);
    }
    opts = opts || {};
    opts.port = process.env.MAZEHALL_PROXY_PORT || opts.port || 8080;
    opts.bunyan = process.env.MAZEHALL_PROXY_LOG || opts.bunyan || false;
    opts.mazehall = opts.mazehall || {};
    opts.mazehall.ns = process.env.MAZEHALL_SOCKET_NS || opts.mazehall.ns || '/proxy';
    opts.mazehall.port = process.env.MAZEHALL_SOCKET_PORT || opts.mazehall.port || 3300;
    MazehallProxy.proxy = Proxy(opts);
    MazehallProxy.proxy.server.on('error', function(err) {
      return console.log('proxy-server ' + err);
    });
    io = Io(opts.mazehall.port);
    ioNs = io.of(opts.mazehall.ns);
    this.connectionListener(ioNs);
    return;
  }

  MazehallProxy.prototype.connectionListener = function(ns) {
    return this.sockets_ = _r.fromEvent(ns, 'connection').onValue(function(socket) {
      socket.emit(MazehallProxy.HELLO);
      registerListener(socket, MazehallProxy.proxy);
      return unregisterListener(socket, MazehallProxy.proxy);
    });
  };

  return MazehallProxy;

})();

module.exports = MazehallProxy;
