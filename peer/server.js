const fs = require('fs');
const https = require('https');
const express = require('express');
const { PeerServer } = require('peer');

const privateKey = fs.readFileSync('./privkey.pem', 'utf8');
const certificate = fs.readFileSync('./cert.pem', 'utf8');
const ca = fs.readFileSync('./chain.pem', 'utf8');

const app = express();

const credentials = {
  key: privateKey,
  cert: certificate,
  ca: ca
};

const httpsServer = https.createServer(credentials);

const peerServer = PeerServer({
  port: 9000,
  path: '/peerjs',
  ssl: credentials
});

peerServer.on('connection', (client) => {
  console.log(`Client connected: ${client.getId()}`);
});

peerServer.on('disconnect', (client) => {
  console.log(`Client disconnected: ${client.getId()}`);
});

httpsServer.listen(9000, () => {
  console.log('PeerJS server running on https://be-live.ytakag.com:9000');
});
