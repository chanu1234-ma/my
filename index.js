const { makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, DisconnectReason, getContentType, Browsers } = require('@whiskeysockets/baileys');
const P = require('pino');
const fs = require('fs');

async function startDraculaBot() {
  const { state, saveCreds } = await useMultiFileAuthState('./auth_info_baileys');
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    logger: P({ level: 'silent' }),
    printQRInTerminal: true,
    browser: Browsers.macOS('Dracula'),
    auth: state
  });

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'open') {
      console.log('✅ Dracula Bot connected!');
    } else if (connection === 'close') {
      const reason = lastDisconnect?.error?.output?.statusCode;
      if (reason !== DisconnectReason.loggedOut) {
        startDraculaBot();
      } else {
        console.log('❌ Logged out. Please restart and scan QR again.');
      }
    }
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message) return;
    const from = msg.key.remoteJid;
    const type = getContentType(msg.message);
    const text = (type === 'conversation') ? msg.message.conversation :
      (type === 'extendedTextMessage') ? msg.message.extendedTextMessage.text : '';

    if (text.toLowerCase() === 'hi') {
      await sock.sendMessage(from, { text: '👋 Hello from Dracula Bot!' });
    }
  });
}

startDraculaBot();
