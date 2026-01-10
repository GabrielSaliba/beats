const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const db = require('./database')
const {getTotal, incrementCounter, resetDatabase, getAllUsers, getRanking, getUser} = require('./functions')

const GROUP_ID = ["120363423600712009@g.us", "109096514637843@lid", "120363406661638784@g.us"];
const MESSAGE_TEMPLATE = /^Eu bebi (\d+)$/i;

const client = new Client({
  puppeteer: {
    executablePath:
      process.env.PUPPETEER_EXECUTABLE_PATH,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-gpu",
      "--disable-dev-shm-usage",
    ],
  },
  authStrategy: new LocalAuth({
    dataPath: "./sessions",
  }),
});

client.once('ready', () => {
    console.log('Client is ready!');
});

client.on('qr', (qr) => {
    qrcode.generate(qr, {small: true});
});

client.on('message_create', async message => {
  try {
    if (!GROUP_ID.includes(message.from)) return
    if (message.body === '!status') {
      message.reply('Bot is alive 🍺')
    }

    if (message.body === '!ranking') {
      const ranking = await getRanking();

      if (!ranking.length) {
        await message.reply('Ainda não tem ninguém no ranking 🍺');
        return;
      }

      const text = ranking
        .map((user, index) => {
          const position = index + 1;
          const name = user.name || 'Usuário desconhecido';
          const total = user.total;

          return `${position}️⃣ ${name} — ${total} unidades`;
        })
        .join('\n');

      const replyMessage = `🏆 Ranking Skol Beats 🍺\n\n${text}`;

      await message.reply(replyMessage);
    }
    if (!isValidMessage(message)) return
    
    const userId = message.author
    const match = message.body.match(MESSAGE_TEMPLATE)
    const amount = Number(match[1]);
    console.log(amount)

    if (isNaN(amount) || amount <= 0 || amount > 10) {
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

// server http
const http = require('http')

http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`)
  if (req.method === 'POST' && req.url.startsWith('/reset')) {

    try {
      await resetDatabase()
      res.writeHead(200)
      res.end('Contadores resetados com sucesso 🍺')
    } catch (err) {
      console.error(err)
      res.writeHead(500)
      res.end('Erro ao resetar')
    }
    return
  }

    // 🔍 todos os usuários
  if (req.method === 'GET' && url.pathname === '/users') {
    try {
      const users = await getAllUsers()
      res.writeHead(200, { 'Content-Type': 'application/json' })
      return res.end(JSON.stringify(users))
    } catch (err) {
      res.writeHead(500)
      return res.end('Erro ao buscar usuários')
    }
  }

    // 👤 usuário específico
  if (req.method === 'GET' && url.pathname === '/user') {
    const userId = url.searchParams.get('id')
    if (!userId) {
      res.writeHead(400)
      return res.end('Missing user id')
  }
}

    // 🏆 ranking
  if (req.method === 'GET' && url.pathname === '/ranking') {
    try {
      const ranking = await getRanking()
      res.writeHead(200, { 'Content-Type': 'application/json' })
      return res.end(JSON.stringify(ranking))
    } catch (err) {
      res.writeHead(500)
      return res.end('Erro ao buscar ranking')
    }
  }

  const total = await getTotal();
  // healthcheck
  res.writeHead(200)
  res.end(`Bot alive 🍺 - Total: ${total}`)
}).listen(3000)
