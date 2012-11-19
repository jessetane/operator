#!/usr/bin/env node

/*
 *  index.js
 *
 */


var args = process.argv.slice(2);
if (args.length) {
  process.env.PORT = args[0];
}

exports = require("./lib/operator");

