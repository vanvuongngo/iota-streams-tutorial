// Copyright 2020-2021 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

const crypto = require('node:crypto')

function createSeed() {
  const seed = crypto.createHash('sha256').update(crypto.randomBytes(256)).digest('hex');

  return seed;
}


function toBytes(str) {
  var bytes = [];
  for (var i = 0; i < str.length; ++i) {
    bytes.push(str.charCodeAt(i));
  }
  return bytes;
}


function fromBytes(bytes) {
  var str = "";
  for (var i = 0; i < bytes.length; ++i) {
    str += String.fromCharCode(bytes[i]);
  }
  return str;
}


function getExplorerUrl(network, messageId) {
  return (`https://explorer.iota.org/${network}/message/${messageId}`);
}


exports.createSeed = createSeed;
exports.toBytes = toBytes;
exports.fromBytes = fromBytes;
exports.getExplorerUrl = getExplorerUrl;