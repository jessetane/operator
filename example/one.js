#!/usr/bin/env node

/*
 *  one.js
 *
 */


var http = require("http");
var request = require("request");

var server = http.createServer(function (req, res) {
  res.end("one!");
});

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
