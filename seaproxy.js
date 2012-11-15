#!/usr/bin/env node

/*
 *  seaproxy.js
 *
 */
 

var env = process.env;
env.SEAPORT_PORT = env.SEAPORT_PORT || 8000;
env.SEAPROXY_PORT = env.SEAPROXY_PORT || 8080;

var connect = require("connect");
var httpProxy = require("http-proxy");
var seaport = require('seaport');


// proxy router
var proxy = new httpProxy.RoutingProxy();
proxy.on('upgrade', function(req, socket, head) {
  proxy.proxyWebSocketRequest(req, socket, head);
});

// seaport server
seaport = seaport.createServer();
seaport.listen(env.SEAPORT_PORT);
seaport.on("register", console.log.bind(null, "register"));
seaport.on("free", console.log.bind(null, "free"));

// seaproxy server
var seaproxy = connect();
seaproxy.use(connect.query());
seaproxy.use(proxyServices);
seaproxy.use(connect.bodyParser());
seaproxy.use(error);
seaproxy.listen(env.SEAPROXY_PORT);
console.log("Seaproxy listening on port", env.SEAPROXY_PORT);

// proxy incoming requests to registered services
function proxyServices (req, res, next) {
  var serviceName = getServiceName(req);
  try {
    var services = seaport.query(serviceName);
    proxy.proxyRequest(req, res, {
      host: services[0].host,
      port: services[0].port
    });
  } catch (err) {
    next();
  }
}

// serve specific versions of a service via query param
function getServiceName (req) {
  var rawhost = req.headers.host;
  var parts = rawhost.split(":");
  var name = parts[0];
  var version = req.query.version;
  if (version) name += "@" + version
  return name;
}

// error handler
function error (req, res) {
  var url = req.url.split("?")[0];
  var message = req.method + " " + url;
  message += "\nHeaders: " + JSON.stringify(req.headers, true, 2);
  message += "\nQuery: " + JSON.stringify(req.query, true, 2);
  message += "\nBody: " + JSON.stringify(req.body, true, 2);
  console.log(message);
  res.end("Service '" + getServiceName(req) + "' not found");
}
