require("dotenv").config();
const puppeteer = require("puppeteer"); // Replaced axios/cheerio

// --- CONFIGURATION ---
const token = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;
const url = "https://toto.bg/";

const REQUEST_TIMEOUT = 30000;
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;

// --- HELPER FUNCTIONS ---

async function retryRequest(requestFn, retries = MAX_RETRIES) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      const isLastAttempt = attempt === retries;
      // Puppeteer specific retryable errors (timeouts or navigation issues)
      const isRetriableError =
        error.name === "TimeoutError" ||
        error.message.includes("navigating") ||
        error.code === "ECONNREFUSED";

      if (isLastAttempt || !isRetriableError) throw error;

      const delay = RETRY_DELAY * Math.pow(2, attempt);
      console.log(
        `⚠️ Attempt ${attempt + 1} failed: ${error.message}. Retrying in ${delay / 1000}s...`,
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

function cleanJackpotValue(rawValue) {
  if (!rawValue) throw new Error("Raw jackpot value is empty");
  let cleaned = rawValue.split("лева")[0];
  cleaned = cleaned.replace(/\s+/g, " ").trim();
  cleaned = cleaned + " лв.";
  if (!/\d/.test(cleaned)) throw new Error(`Invalid value: "${cleaned}"`);
  return cleaned;
}

async function sendTelegramMessage(message) {
  // We keep axios for the Telegram POST since it's a simple API call
  const axios = require("axios");
  await retryRequest(async () => {
    await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
      chat_id: chatId,
      text: message,
      parse_mode: "Markdown",
    });
  });
}

// --- MAIN FUNCTION ---
async function scrapeAndNotify() {
  if (!token || !chatId) {
    console.error("❌ Missing Telegram credentials.");
    process.exit(1);
  }

  console.log("🚀 Starting Puppeteer Toto scraper...");

  // Launch browser outside retry to manage lifecycle
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();

    // Modern way to set User-Agent (avoiding deprecation)
    await page.setUserAgent({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
    });

    const jackpotValueRaw = await retryRequest(async () => {
      console.log("📡 Navigating to toto.bg...");
      await page.goto(url, {
        waitUntil: "networkidle2",
        timeout: REQUEST_TIMEOUT,
      });

      console.log("🔍 Waiting for jackpot element...");
      await page.waitForSelector(".jackpot-value", { timeout: 15000 });

      return await page.evaluate(() => {
        const el = document.querySelector(".jackpot-value");
        return el ? el.innerText : null;
      });
    });

    console.log(`✅ Found: "${jackpotValueRaw}"`);
    const jackpotValueClean = cleanJackpotValue(jackpotValueRaw);
    const message = `💰 The current Toto jackpot is: *${jackpotValueClean}*`;

    await sendTelegramMessage(message);
    console.log("🎉 Success! Telegram notified.");
  } catch (error) {
    console.error("\n❌ Scraper failed:", error.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

scrapeAndNotify();
