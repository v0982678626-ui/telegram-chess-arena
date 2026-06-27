# Deploy Chess Arena 24/7

## 1. Upload the project

Create a GitHub repository and upload this project.

## 2. Create a Render Blueprint

Open Render, choose **New +** -> **Blueprint**, connect the GitHub repository, and Render will read `render.yaml`.

## 3. Add secrets

In Render environment variables set:

- `BOT_TOKEN`: your Telegram bot token from BotFather
- `PUBLIC_URL`: the HTTPS URL Render gives you, for example `https://telegram-chess-arena.onrender.com`

The app stores ratings and games at `/var/data/chess.json` on a persistent disk.

## 4. Configure Telegram

After Render deploys, run locally:

```powershell
$env:PUBLIC_URL="https://your-render-url.onrender.com"
npm run telegram:setup
```

Or set `PUBLIC_URL` in `.env` to the Render URL and run:

```powershell
npm run telegram:setup
```

## 5. Check

Open:

```text
https://your-render-url.onrender.com/api/health
```

If it returns `{"ok":true}`, the bot web app is online.
