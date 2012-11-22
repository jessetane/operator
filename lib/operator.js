/*
 *  operator.js
 *
 */


var env = process.env;
env.PORT = env.PORT || 8080;
env.DNS_PORT = env.DNS_PORT || 8079;
env.PORT_OF_PORTLAND = env.PORT_OF_PORTLAND || 1845;

var connect = require("connect");
var httpProxy = require("http-proxy");
//var dnsserver = require("dnsserver");
var portland = require("portland").createServer(env.PORT_OF_PORTLAND);

// proxy router
var proxy = new httpProxy.RoutingProxy();
proxy.on("upgrade", function(req, socket, head) {
  proxy.proxyWebSocketRequest(req, socket, head);
});

/*
// dns server
var server = new dnsserver.Server();
server.on("request", function (req, res) {
  console.log("dns lookup requested for: " + req.question.name);
  var services = portland.query(req.question.name);
  if (services.length) {
    res.addRR(req.question.name, 1, 1, 600, "127.0.0.1");
  } else {
    res.header.rcode = 3;
  }
  res.send();
});
server.bind(env.DNS_PORT);
console.log("dns server listening on " + env.DNS_PORT);
*/

// http server stack
var server = connect();
server.use(connect.query());
server.use(proxyServices);
server.use(connect.logger("tiny"));
server.listen(env.PORT);
console.log("operator listening on " + env.PORT);

// proxy logic middleware
function proxyServices (req, res, next) {
  var serviceName = getServiceName(req);
  try {
    var service = portland.lookup(serviceName)[0];
    proxy.proxyRequest(req, res, {
      host: service.host,
      port: service.port
    });
  } catch (err) {
    next();
  }
}

// detect specific versions of a service via query param
function getServiceName (req) {
  var rawhost = req.headers.host;
  var parts = rawhost.split(":");
  var name = parts[0];
  var version = req.query.version;
  if (version) name += "@" + version
  return name;
}
