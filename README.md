# 🎰 Toto Jackpot Scraper

Automated web scraper that monitors the Toto lottery jackpot amount from [toto.bg](https://toto.bg/) and sends real-time notifications via Telegram.

## 📋 Features

- 🔄 **Automated Scraping**: Fetches the latest jackpot value from toto.bg
- 📱 **Telegram Notifications**: Sends formatted messages with jackpot amounts
- ⏰ **Scheduled Execution**: Runs automatically via GitHub Actions (Sundays & Thursdays)
- 🔁 **Retry Logic**: Handles transient network failures with exponential backoff
- ✅ **Input Validation**: Validates scraped data to ensure accuracy
- 🛡️ **Error Handling**: Comprehensive error logging for debugging
- ⚡ **Timeout Protection**: Prevents hanging on slow/unresponsive servers

## 🚀 Quick Start

### Prerequisites

- Node.js 20.x or higher
- A Telegram Bot (get token from [@BotFather](https://t.me/botfather))
- Your Telegram Chat ID

### Installation

1. Clone the repository:
```bash
git clone https://github.com/AndreyTodorov/jackpot.git
cd jackpot
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the project root:
```env
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_CHAT_ID=your_chat_id_here
```

### Local Testing

Run the scraper manually:
```bash
node jackpot.js
```

Expected output:
```
🚀 Starting Toto jackpot scraper...
📍 Target URL: https://toto.bg/
📡 Fetching page content...
✅ Page fetched successfully.
🔍 Raw value found: "5 000 000 лева"
🔢 Cleaned value: "5 000 000 лв."
📬 Sending message to Telegram...
   Message: "💰 The current Toto jackpot is: *5 000 000 лв.*"
🎉 Success! Message sent to Telegram.
✨ Scraper execution completed successfully.
```

## ⚙️ GitHub Actions Setup

The scraper runs automatically using GitHub Actions:

### Schedule

- **Days**: Every Sunday and Thursday
- **Time**: 12:00 UTC (14:00-15:00 Bulgaria time, depending on DST)

### Configuration

1. Go to your repository Settings → Secrets and variables → Actions
2. Add the following secrets:
   - `TELEGRAM_BOT_TOKEN`: Your Telegram bot token
   - `TELEGRAM_CHAT_ID`: Your Telegram chat ID

### Manual Execution

You can trigger the scraper manually:
1. Go to the "Actions" tab in your repository
2. Select "Toto Jackpot Scraper" workflow
3. Click "Run workflow"

## 🛠️ Configuration

### Environment Variables

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `TELEGRAM_BOT_TOKEN` | Token from @BotFather | Yes | `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz` |
| `TELEGRAM_CHAT_ID` | Your Telegram chat ID | Yes | `123456789` |

### Scraper Settings

Edit `jackpot.js` to customize:

```javascript
const REQUEST_TIMEOUT = 30000; // HTTP request timeout (ms)
const MAX_RETRIES = 3;         // Number of retry attempts
const RETRY_DELAY = 2000;      // Base delay between retries (ms)
```

## 📊 How It Works

1. **Fetch**: Downloads HTML from toto.bg with timeout protection
2. **Parse**: Extracts jackpot value using CSS selector `div.jackpot-value`
3. **Clean**: Removes Bulgarian text and normalizes formatting
4. **Validate**: Checks that the value contains digits and is reasonable
5. **Notify**: Sends formatted message to Telegram with retry logic
6. **Log**: Outputs detailed execution information for debugging

## 🧪 Testing

Run the test suite:
```bash
npm test
```

Run tests in watch mode during development:
```bash
npm run test:watch
```

## 📝 Project Structure

```
jackpot/
├── .github/
│   └── workflows/
│       └── jackpot.yml      # GitHub Actions workflow
├── .env.example             # Example environment variables
├── .gitignore              # Git ignore rules
├── jackpot.js              # Main scraper script
├── jackpot.test.js         # Test suite
├── package.json            # Project metadata & dependencies
├── package-lock.json       # Locked dependency versions
└── README.md              # This file
```

## 🐛 Troubleshooting

### Scraper fails with "element not found"

The website structure may have changed. Check if the CSS selector `div.jackpot-value` is still valid:
```bash
curl https://toto.bg/ | grep -i jackpot
```

### Telegram messages not received

1. Verify your bot token is correct
2. Ensure the bot has been started (send `/start` to your bot)
3. Verify chat ID is correct (use [@userinfobot](https://t.me/userinfobot))
4. Check GitHub Actions logs for error details

### Dependencies not installing

Ensure you're using Node.js 20.x or higher:
```bash
node --version
npm install
```

## 📜 License

ISC License - see LICENSE file for details

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📧 Support

For issues and questions, please open an issue on GitHub.

---

Made with ❤️ for lottery enthusiasts
