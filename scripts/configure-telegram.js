import 'dotenv/config';

const { BOT_TOKEN, PUBLIC_URL } = process.env;

function fail(message) {
  console.error(message);
  process.exit(1);
}

if (!BOT_TOKEN || BOT_TOKEN.includes('replace_me')) {
  fail('BOT_TOKEN is missing. Add it to .env first.');
}

if (!PUBLIC_URL || !PUBLIC_URL.startsWith('https://')) {
  fail('PUBLIC_URL must be a public HTTPS URL. Localhost will not work inside Telegram.');
}

async function telegram(method, payload) {
  const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  if (!data.ok) {
    fail(`${method} failed: ${data.description || 'Unknown Telegram API error'}`);
  }

  return data.result;
}

const bot = await telegram('getMe', {});

await telegram('setMyCommands', {
  commands: [
    { command: 'start', description: 'Открыть шахматную арену' },
    { command: 'play', description: 'Играть в шахматы' },
    { command: 'rating', description: 'Посмотреть рейтинг' }
  ]
});

await telegram('setChatMenuButton', {
  menu_button: {
    type: 'web_app',
    text: 'Играть',
    web_app: { url: PUBLIC_URL }
  }
});

console.log(`Telegram bot @${bot.username} is configured.`);
console.log(`Web App URL: ${PUBLIC_URL}`);
