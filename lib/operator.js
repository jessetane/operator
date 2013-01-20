/*
 *  operator.js
 *
 */


var env = process.env
env.PORT = env.PORT || 8080
env.PORT_OF_PORTLAND = env.PORT_OF_PORTLAND || 1845

var connect = require("connect")
var httpProxy = require("http-proxy")
var portland = require("portland").createServer(env.PORT_OF_PORTLAND)

// proxy router
var proxy = new httpProxy.RoutingProxy()
proxy.on("upgrade", function(req, socket, head) {
  proxy.proxyWebSocketRequest(req, socket, head)
})

// http server stack
var server = connect()
server.use(proxyServices)
server.use(connect.logger("tiny"))
server.listen(env.PORT)
console.log("operator listening on " + env.PORT)

// proxy logic middleware
function proxyServices (req, res, next) {
  var serviceName = getServiceName(req)
  var services = portland.lookup(serviceName)
  if (services.length !== 0) {
    proxy.proxyRequest(req, res, {
      host: "localhost",
      port: services[0].port
    })
  } else {
    next()
  }
}

// detect specific versions of a service via query param
function getServiceName (req) {
  var rawhost = req.headers.host
  var parts = rawhost.split(":")
  var name = parts[0]
  var version = req.headers.version
  if (version) name += "@" + version
  return name
}
