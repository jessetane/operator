#!/usr/bin/env node

/*
 *  two.js
 *
 */


var http = require("http");
var request = require("request");
var operator = require("../operator").connect(8080);

var server = http.createServer(function (req, res) {
  res.end("two!");
}).listen(operator.get("two"));

var opts = {
  url: "localhost:8080/register",
  json: {
    host: "localhost",
    version: "1.0.0"
  }
}
request.post(opts, function (err, res, data) {
  if (err) {
    console.log(err);
  } else {
    var port = data;
    server.listen(port);
  }
});
