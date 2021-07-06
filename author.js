// Copyright 2020-2021 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

const streams = require("@jmcanterafonseca-iota/iota_streams_wasm");
const fetch = require("node-fetch");
const { createSeed, from_bytes } = require('./helpers');
const { readFileSync, writeFileSync } = require('fs');

global.fetch = fetch;
global.Headers = fetch.Headers;
global.Request = fetch.Request;
global.Response = fetch.Response;

streams.set_panic_hook();

// Node settings
let node = "https://chrysalis-nodes.iota.org/";
let options = new streams.SendOptions(node, 9, true, 1);

async function createAuthor() {
  console.log('\x1b[36m%s\x1b[0m', 'Author: Create author');

// Create author with new seed
  let authorSeed = createSeed();
  let author = new streams.Author(authorSeed, options.clone(), false);
  
  console.log("Author seed: ", authorSeed);
  console.log("Channel address: ", author.channel_address());
  console.log("Multi branching: ", author.is_multi_branching());

  return(author.clone());
}


async function announceChannel(author) {
  console.log('\x1b[36m%s\x1b[0m', 'Author: Create channel');

  // Announce new channel
  let response = await author.clone().send_announce();
  let announcementLink = response.get_link();

  console.log("Announcement at: ", announcementLink.to_string());

  // Write announcement link to off-Tangle link exchange
  writeFileSync('./offTangleComs/1_announcement.txt', announcementLink.to_string());
}


async function receiveSubscription(author) {
  console.log('\x1b[36m%s\x1b[0m', 'Author: Receive subscription and send keyload message');

  // Receive subscription
  let subscriptionLinkString = readFileSync('./offTangleComs/2_subscription.txt', 'utf8');
  let subscriptionLink = streams.Address.from_string(subscriptionLinkString);
  await author.clone().receive_subscribe(subscriptionLink.copy());

  // Read announcement message
  let announcementLinkString = readFileSync('./offTangleComs/1_announcement.txt', 'utf8');
  let announcementLink = streams.Address.from_string(announcementLinkString);

  // Send keyload message
  response = await author.clone().send_keyload_for_everyone(announcementLink);
  let keyloadLink = response.get_link();

  console.log("Keyload at: ", keyloadLink.to_string());

  // Write keyload link to off-Tangle link exchange
  writeFileSync('./offTangleComs/3_keyload.txt', keyloadLink.to_string());
}


async function fetchNewMessages(author) {
  console.log('\x1b[36m%s\x1b[0m', 'Author: Fetch new messages from channel');

  // Fetch new messages
  let exists = true;
  while (exists) {
    let responses = await author.clone().fetch_next_msgs();

    if (responses.length === 0) {
      exists = false;
    }

    for (var i = 0; i < responses.length; i++) {
      console.log("Message link:",      responses[i].get_link().to_string());
      console.log("Public payload: ",   from_bytes(responses[i].get_message().get_public_payload()));
      console.log("Masked payload: ",   from_bytes(responses[i].get_message().get_masked_payload()));
      console.log("\n");
    }
  }
}


exports.createAuthor = createAuthor;
exports.announceChannel = announceChannel;
exports.receiveSubscription = receiveSubscription;
exports.fetchNewMessages = fetchNewMessages;