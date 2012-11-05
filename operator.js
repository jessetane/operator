#!/usr/bin/env node

/*
 *  operator.js
 *
 */
 

var connect = require("connect");
var httpProxy = require("http-proxy");
var operatorPort = process.argv[2] || "8080";
var seaport = require('seaport');

// proxy router
var proxy = new httpProxy.RoutingProxy();
proxy.on('upgrade', function(req, socket, head) {
  proxy.proxyWebSocketRequest(req, socket, head);
});

// seaport server
seaport = seaport.createServer();
seaport.listen(8081);
seaport.on("register", function (err, data) {
  console.log("A new service registered!", err, data);
});

// operator server
var operator = connect();
operator.use(connect.query());
operator.use(proxyServices);
operator.use(connect.bodyParser());
operator.use(error);
operator.listen(operatorPort);
console.log("Operator listening on port", operatorPort);

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
