require("dotenv").config();

const axios = require("axios");
const cheerio = require("cheerio");
// const TelegramBot = require("node-telegram-bot-api");

// --- CONFIGURATION ---
// Load your Telegram credentials from environment variables for security.
// We will set these up in GitHub Secrets later.
const token = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;

// The URL of the website we want to scrape.
const url = "https://toto.bg/";

// --- MAIN FUNCTION ---
async function scrapeAndNotify() {
  // Check if credentials are provided
  if (!token || !chatId) {
    console.error("Error: Telegram token or chat ID is not defined.");
    console.error(
      "Please set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID environment variables."
    );
    process.exit(1); // Exit with an error code
  }

  console.log("🚀 Starting scrape...");

  try {
    // 1. Fetch the HTML of the page
    const { data } = await axios.get(url);
    console.log("✅ Page fetched successfully.");

    // 2. Load the HTML into Cheerio
    const $ = cheerio.load(data);

    // 3. Select the element and extract the text
    // The target is a div with the class 'jackpot-value'
    const jackpotValueRaw = $("div.jackpot-value").first().text();
    console.log(`🔍 Raw value found: "${jackpotValueRaw}"`);

    // 4. Clean up the text to get just the number
    // remove everything after "лв." and trim whitespace
    const jackpotValueClean = jackpotValueRaw
      .split("лева")[0]
      .replace(/[^\d.,]/g, " лв.")
      .trim();

    console.log(`🔢 Cleaned value: "${jackpotValueClean}"`);

    if (!jackpotValueClean) {
      throw new Error(
        "Could not find or parse the jackpot value. The website structure might have changed."
      );
    }

    // 5. Format the final message
    const message = `💰 The current Toto jackpot is: *${jackpotValueClean.trim()}*`;
    console.log(`📬 Preparing to send message: "${message}"`);

    // 6. Send the message to Telegram
    await axios.post(
      `https://api.telegram.org/bot${token}/sendMessage?chat_id=${chatId}&text=${message}&parse_mode=Markdown`
    );

    console.log("🎉 Message sent successfully to Telegram!");
  } catch (error) {
    console.error("An error occurred during the process:", error.message);
    process.exit(1); // Exit with an error code
  }
}

// Run the main function
scrapeAndNotify();
