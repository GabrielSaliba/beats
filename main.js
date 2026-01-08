const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const db = require('./database')
const {getTotal, incrementCounter} = require('./functions')

const GROUP_ID = ["120363423600712009@g.us", "109096514637843@lid"];
const MESSAGE_TEMPLATE = /^Eu bebi \d+$/;

const client = new Client({
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    },
    authStrategy: new LocalAuth()
});


client.once('ready', () => {
    console.log('Client is ready!');
});

client.on('qr', (qr) => {
    qrcode.generate(qr, {small: true});
});

client.on('message_create', async message => {
  try {
    console.log(message.author);
    if (!GROUP_ID.includes(message.from)) return
    if (!isValidMessage(message)) return
    
    const userId = message.author
    const match = message.body.match(MESSAGE_TEMPLATE)
    const amount = parseInt(match[0][8]);

    if (isNaN(amount) || amount <= 0 || amount > 5) {
      await message.react('❌')
      return;
    }

    if (match[0][9]) {
      await message.react('❌')
      return;
    }

    const { global } = await incrementCounter(userId, amount);
    await message.react('🍺')
    await message.reply(`Mais ${amount} unidades adicionadas. Total agora: ${global}`)
  } catch(err) {
    console.error(err)
  }
});

function isValidMessage(message) {
    console.log(`Message received: ${message.body}`)
    const match = message.body.match(MESSAGE_TEMPLATE)
    if (!match) return false
    console.warn(`Message match: ${message.body}`)
    return true
}
client.initialize();
