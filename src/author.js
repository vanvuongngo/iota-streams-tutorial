// Copyright 2020-2021 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

const streams = require("@iota/streams/node");
const { createSeed, fromBytes, getExplorerUrl } = require('./helpers');
const { readFileSync, writeFileSync } = require('fs');


streams.set_panic_hook();

// Node settings
const node = "https://chrysalis-nodes.iota.org/";
const options = new streams.SendOptions(node, 9, true, 1);

// Create author with new seed
async function createAuthor() {
  console.log('\x1b[36m%s\x1b[0m', 'Author: Create author and new channel');

  const authorSeed = createSeed();
  const author = new streams.Author(authorSeed, options.clone(), false);

  console.log("Author seed: ", authorSeed);
  console.log("Channel address: ", author.channel_address());
  console.log("Multi branching: ", author.is_multi_branching());

  return author.clone();
}


async function announceChannel(author) {
  console.log('\x1b[36m%s\x1b[0m', 'Author: Send announcement');

  // Announce new channel
  const response = await author.clone().send_announce();
  const announcementLink = response.link;
  console.log("Announcement link: ", announcementLink.toString());

  //Fetch message details
  const announcementMessageDetails = await author.clone().get_client().get_link_details(announcementLink.copy());
  console.log('\x1b[34m%s\x1b[0m', getExplorerUrl("mainnet", announcementMessageDetails.get_metadata().message_id));

  // Write announcement link to off-Tangle link exchange
  writeFileSync('./offTangleComs/1_announcement.txt', announcementLink.toString());
}


async function receiveSubscription(author) {
  console.log('\x1b[36m%s\x1b[0m', 'Author: Receive subscription and send keyload message');

  // Receive subscription
  const subscriptionLinkString = readFileSync('./offTangleComs/2_subscription.txt', 'utf8');
  const subscriptionLink = streams.Address.parse(subscriptionLinkString);
  await author.clone().receive_subscribe(subscriptionLink.copy());

  // Read announcement message
  const announcementLinkString = readFileSync('./offTangleComs/1_announcement.txt', 'utf8');
  const announcementLink = streams.Address.parse(announcementLinkString);

  // Send keyload message
  response = await author.clone().send_keyload_for_everyone(announcementLink);
  const keyloadLink = response.link;
  console.log("Keyload link: ", keyloadLink.toString());

  //Fetch message details
  const keyloadMessageDetails = await author.clone().get_client().get_link_details(keyloadLink.copy());
  console.log('\x1b[34m%s\x1b[0m', getExplorerUrl("mainnet", keyloadMessageDetails.get_metadata().message_id));

  // Write keyload link to off-Tangle link exchange
  writeFileSync('./offTangleComs/3_keyload.txt', keyloadLink.toString());
}


async function fetchNewMessages(author) {
  console.log('\x1b[36m%s\x1b[0m', 'Author: Fetch new messages from channel');

  // Fetch new messages
  let exists = true;
  while (exists) {
    const responses = await author.clone().fetchNextMsgs();

    if (responses.length === 0) {
      exists = false;
    }

    for (var i = 0; i < responses.length; i++) {
      const messageLink = responses[i].link;
      console.log("Message link:", responses[i].link.toString());

      //Fetch message details
      let messageDetails = await author.clone().get_client().get_link_details(messageLink.copy());
      console.log('\x1b[34m%s\x1b[0m', getExplorerUrl("mainnet", messageDetails.get_metadata().message_id));

      console.log("Public payload: ", fromBytes(responses[i].message.get_public_payload()));
      console.log("Masked payload: ", fromBytes(responses[i].message.get_masked_payload()));
      console.log("\n");
    }
  }
}


exports.createAuthor = createAuthor;
exports.announceChannel = announceChannel;
exports.receiveSubscription = receiveSubscription;
exports.fetchNewMessages = fetchNewMessages;