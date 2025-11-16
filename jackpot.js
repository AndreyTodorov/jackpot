require("dotenv").config();

const axios = require("axios");
const cheerio = require("cheerio");

// --- CONFIGURATION ---
const token = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;
const url = "https://toto.bg/";

// Configure axios with timeout and retry logic
const REQUEST_TIMEOUT = 30000; // 30 seconds
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds base delay

// --- HELPER FUNCTIONS ---

/**
 * Makes an HTTP request with retry logic for handling transient failures
 * @param {Function} requestFn - Async function that performs the request
 * @param {number} retries - Number of retry attempts remaining
 * @returns {Promise} - The response from the request
 */
async function retryRequest(requestFn, retries = MAX_RETRIES) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      const isLastAttempt = attempt === retries;
      const isRetriableError =
        error.code === "ECONNABORTED" ||
        error.code === "ETIMEDOUT" ||
        error.code === "ENOTFOUND" ||
        error.code === "ECONNREFUSED" ||
        (error.response && error.response.status >= 500);

      if (isLastAttempt || !isRetriableError) {
        throw error;
      }

      const delay = RETRY_DELAY * Math.pow(2, attempt);
      console.log(
        `⚠️  Request failed (attempt ${attempt + 1}/${retries + 1}): ${
          error.message
        }`
      );
      console.log(`   Retrying in ${delay / 1000} seconds...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

/**
 * Validates and cleans the scraped jackpot value
 * @param {string} rawValue - Raw text scraped from the website
 * @returns {string} - Cleaned and validated jackpot value
 */
function cleanJackpotValue(rawValue) {
  if (!rawValue) {
    throw new Error("Raw jackpot value is empty");
  }

  // Remove the Bulgarian word "лева" (BGN currency) and everything after it
  let cleaned = rawValue.split("лева")[0];

  // Normalize whitespace
  cleaned = cleaned.replace(/\s+/g, " ").trim();

  // Add the currency suffix
  cleaned = cleaned + " лв.";

  // Validate that the result contains digits
  if (!/\d/.test(cleaned)) {
    throw new Error(`Cleaned value contains no digits: "${cleaned}"`);
  }

  // Optional: Validate reasonable range (jackpot should be substantial)
  const numericValue = parseFloat(cleaned.replace(/[^\d.]/g, ""));
  if (numericValue < 1000) {
    console.warn(
      `⚠️  Warning: Unusually low jackpot value: ${numericValue} BGN`
    );
  } else if (numericValue > 100000000) {
    console.warn(
      `⚠️  Warning: Unusually high jackpot value: ${numericValue} BGN`
    );
  }

  return cleaned;
}

/**
 * Sends a message to Telegram using the Bot API
 * @param {string} message - The message to send
 */
async function sendTelegramMessage(message) {
  await retryRequest(async () => {
    const response = await axios.post(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        chat_id: chatId,
        text: message,
        parse_mode: "Markdown",
      },
      {
        timeout: REQUEST_TIMEOUT,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.data.ok) {
      throw new Error(
        `Telegram API returned error: ${JSON.stringify(response.data)}`
      );
    }

    return response;
  });
}

// --- MAIN FUNCTION ---
async function scrapeAndNotify() {
  // Validate environment variables
  if (!token || !chatId) {
    console.error("❌ Error: Telegram credentials are not defined.");
    console.error(
      "   Please set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID environment variables."
    );
    console.error(
      "   For local testing, create a .env file with these variables."
    );
    process.exit(1);
  }

  console.log("🚀 Starting Toto jackpot scraper...");
  console.log(`📍 Target URL: ${url}`);

  try {
    // 1. Fetch the HTML of the page with timeout and retry
    console.log("📡 Fetching page content...");
    const { data } = await retryRequest(async () => {
      return await axios.get(url, {
        timeout: REQUEST_TIMEOUT,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });
    });
    console.log("✅ Page fetched successfully.");

    // 2. Load the HTML into Cheerio
    const $ = cheerio.load(data);

    // 3. Select the element and validate it exists
    const element = $("div.jackpot-value").first();
    if (element.length === 0) {
      throw new Error(
        'Could not find element with selector "div.jackpot-value". ' +
          "The website structure may have changed."
      );
    }

    const jackpotValueRaw = element.text();
    console.log(`🔍 Raw value found: "${jackpotValueRaw}"`);

    // 4. Clean and validate the jackpot value
    const jackpotValueClean = cleanJackpotValue(jackpotValueRaw);
    console.log(`🔢 Cleaned value: "${jackpotValueClean}"`);

    // 5. Format the final message
    const message = `💰 The current Toto jackpot is: *${jackpotValueClean}*`;
    console.log(`📬 Sending message to Telegram...`);
    console.log(`   Message: "${message}"`);

    // 6. Send the message to Telegram
    await sendTelegramMessage(message);

    console.log("🎉 Success! Message sent to Telegram.");
    console.log("✨ Scraper execution completed successfully.");
  } catch (error) {
    console.error("\n❌ An error occurred during execution:");
    console.error(`   Error Type: ${error.constructor.name}`);
    console.error(`   Message: ${error.message}`);

    // Log additional context for HTTP errors
    if (error.response) {
      console.error(`   HTTP Status: ${error.response.status}`);
      console.error(
        `   Response Data: ${JSON.stringify(error.response.data, null, 2)}`
      );
    }

    // Log error code if available (network errors)
    if (error.code) {
      console.error(`   Error Code: ${error.code}`);
    }

    // Log stack trace for debugging
    console.error("\n📋 Full stack trace:");
    console.error(error.stack);

    process.exit(1);
  }
}

// Run the main function
scrapeAndNotify();
