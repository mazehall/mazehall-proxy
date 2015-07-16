# Mazehall Proxy

SECURITY HINT: never ever use the proxy in production WITHOUT a firewall restriction to the websocket registration port - default 3300.

## Description

Mazehall-proxy is a dynamic reverse proxy.

* written in coffee-script -> javascript
* on top of [redbird proxy][redbird] -> http-proxy
* websocket ready
* dynamic registration over websockets
* dynamic unregistration on disconnect
* connectivity check on registration
* multi hosts and multi backends ready
* Environment variables for docker friendly usage


```javascript
    var Proxy = require('mazehall-proxy');
    Proxy.Server({port: 80});
```

## Installation

    npm install --save mazehall-proxy



## Usage

All configuration options of [redbird][redbird] are covered.

## Reference

### MazehallProxy.Server(opts)

This is the Proxy constructor. Creates a new Proxy and starts listening to
the given ports.
Default proxy: 8080, ws-server: 3300

__Arguments__

```javascript
    opts {Object} Options to pass to the proxy:
    {
    	port: {Number} // port number that the proxy will listen to. default 8080
    	mazehall: { // Optional mazehall-proxy settings
    	    port: {Number} // Optional websocket server will listen to. default 3300
    	    ns: namespace // Optional websocket namespace - default "/proxy"
    	}
    	ssl: { // Optional SSL proxying.
    		port: {Number} // SSL port the proxy will listen to.
    		// Default certificates
    		key: keyPath,  
    		cert: certPath,
    		ca: caPath // Optional.
            redirect: true, // Disable HTTPS autoredirect to this route.
    	}
        bunyan: {Object} // Bunyan options. (DEFAULT: false) If you want to enable bunyan, just set this option.
	}
```

Check [bunyan](https://github.com/trentm/node-bunyan) for info.
Keep in mind that having logs enabled incours in a performance penalty of about one order of magnitude per request.

#### Environmet variables


__MAZEHALL_PROXY_PORT__
- the proxy port to listen on for incoming proxy requests (default: `8080`)

---------------------------------------
__MAZEHALL_SOCKET_NS__
- namespace to be used for the websocket registration connection (default: `/proxy`)

---------------------------------------
__MAZEHALL_SOCKET_PORT__
- websocket server port (default: `3300`)

---------------------------------------


### MazehallProxy.Client(server, hosts)

This is the Client constructor. Creates a new Proxy-Client and starts listening to
the server start event. If triggered then it starts a websocket client and registers
the public addresses and server port.

__Arguments__

`server` - {Object} a http instance

`hosts` - {String|Array} Hosts url

Example

```javascript
process.env.MAZEHALL_PROXY_MASTER = "ws://" + config.proxy.ws.master + ":" + config.proxy.ws.port + "/proxy"
var proxy = MhProxy.Client(server, config.proxy.hosts);
```

#### Environmet variables

MAZEHALL_PROXY_MASTER
- websocket connection string
  default: `ws://localhost:3300/proxy`

---------------------------------------


## Roadmap

* add security methods to the registration process
* fix websockets in balancing scenarios

[redbird]: https://github.com/OptimalBits/redbird
