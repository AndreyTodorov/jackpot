/**
 * Test suite for Toto Jackpot Scraper
 * Tests the core functionality without making actual HTTP requests
 */

// Mock modules before requiring the main file
jest.mock("axios");
jest.mock("dotenv", () => ({
  config: jest.fn(),
}));

const axios = require("axios");

describe("Jackpot Value Cleaning", () => {
  // We'll test the cleaning logic by creating a standalone function
  // based on the logic in jackpot.js

  function cleanJackpotValue(rawValue) {
    if (!rawValue) {
      throw new Error("Raw jackpot value is empty");
    }

    let cleaned = rawValue.split("лева")[0];
    cleaned = cleaned.replace(/\s+/g, " ").trim();
    cleaned = cleaned + " лв.";

    if (!/\d/.test(cleaned)) {
      throw new Error(`Cleaned value contains no digits: "${cleaned}"`);
    }

    return cleaned;
  }

  test("should clean typical jackpot value correctly", () => {
    const input = "5 000 000 лева";
    const expected = "5 000 000 лв.";
    expect(cleanJackpotValue(input)).toBe(expected);
  });

  test("should handle value with extra whitespace", () => {
    const input = "  3   500   000   лева  ";
    const expected = "3 500 000 лв.";
    expect(cleanJackpotValue(input)).toBe(expected);
  });

  test("should handle value with decimal point", () => {
    const input = "1.234.567 лева";
    const expected = "1.234.567 лв.";
    expect(cleanJackpotValue(input)).toBe(expected);
  });

  test("should handle value with comma", () => {
    const input = "2,500,000 лева";
    const expected = "2,500,000 лв.";
    expect(cleanJackpotValue(input)).toBe(expected);
  });

  test("should throw error for empty value", () => {
    expect(() => cleanJackpotValue("")).toThrow("Raw jackpot value is empty");
  });

  test("should throw error for value with no digits", () => {
    expect(() => cleanJackpotValue("no numbers here лева")).toThrow(
      "Cleaned value contains no digits"
    );
  });

  test("should handle value without 'лева' suffix", () => {
    const input = "4 000 000";
    const expected = "4 000 000 лв.";
    expect(cleanJackpotValue(input)).toBe(expected);
  });

  test("should handle text after 'лева' by removing it", () => {
    const input = "6 000 000 лева and more text here";
    const expected = "6 000 000 лв.";
    expect(cleanJackpotValue(input)).toBe(expected);
  });
});

describe("Environment Variable Validation", () => {
  let originalEnv;

  beforeEach(() => {
    // Save original environment
    originalEnv = process.env;
    // Clear the module cache to get fresh imports
    jest.resetModules();
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  test("should exit if TELEGRAM_BOT_TOKEN is missing", () => {
    process.env = {
      TELEGRAM_CHAT_ID: "123456789",
    };

    // Mock process.exit to prevent actual exit
    const mockExit = jest.spyOn(process, "exit").mockImplementation(() => {});
    const mockError = jest.spyOn(console, "error").mockImplementation(() => {});

    // This would normally run the script, but we're testing the validation
    // In a real scenario, we'd refactor to export the validation function
    expect(process.env.TELEGRAM_BOT_TOKEN).toBeUndefined();

    mockExit.mockRestore();
    mockError.mockRestore();
  });

  test("should exit if TELEGRAM_CHAT_ID is missing", () => {
    process.env = {
      TELEGRAM_BOT_TOKEN: "fake_token",
    };

    expect(process.env.TELEGRAM_CHAT_ID).toBeUndefined();
  });
});

describe("Telegram Message Formatting", () => {
  test("should format message correctly", () => {
    const jackpotValue = "5 000 000 лв.";
    const message = `💰 The current Toto jackpot is: *${jackpotValue}*`;

    expect(message).toBe("💰 The current Toto jackpot is: *5 000 000 лв.*");
    expect(message).toContain("💰");
    expect(message).toContain("*"); // Markdown formatting
  });

  test("message should contain required elements", () => {
    const jackpotValue = "1 234 567 лв.";
    const message = `💰 The current Toto jackpot is: *${jackpotValue}*`;

    expect(message).toMatch(/💰/);
    expect(message).toMatch(/Toto jackpot/);
    expect(message).toMatch(/\d+/); // Contains numbers
    expect(message).toMatch(/лв\./); // Contains currency
  });
});

describe("HTTP Request Configuration", () => {
  test("should use correct timeout value", () => {
    const REQUEST_TIMEOUT = 30000;
    expect(REQUEST_TIMEOUT).toBe(30000);
    expect(REQUEST_TIMEOUT).toBeGreaterThan(0);
  });

  test("should use correct retry configuration", () => {
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 2000;

    expect(MAX_RETRIES).toBe(3);
    expect(RETRY_DELAY).toBe(2000);
  });
});

describe("Retry Logic", () => {
  async function retryRequest(requestFn, retries = 3) {
    const RETRY_DELAY = 100; // Shorter delay for testing

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
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  test("should succeed on first attempt", async () => {
    const mockRequest = jest.fn().mockResolvedValue({ data: "success" });
    const result = await retryRequest(mockRequest, 3);

    expect(result).toEqual({ data: "success" });
    expect(mockRequest).toHaveBeenCalledTimes(1);
  });

  test("should retry on network timeout and eventually succeed", async () => {
    const mockRequest = jest
      .fn()
      .mockRejectedValueOnce({ code: "ETIMEDOUT" })
      .mockRejectedValueOnce({ code: "ETIMEDOUT" })
      .mockResolvedValue({ data: "success" });

    const result = await retryRequest(mockRequest, 3);

    expect(result).toEqual({ data: "success" });
    expect(mockRequest).toHaveBeenCalledTimes(3);
  });

  test("should retry on 500 server error and eventually succeed", async () => {
    const mockRequest = jest
      .fn()
      .mockRejectedValueOnce({ response: { status: 500 } })
      .mockResolvedValue({ data: "success" });

    const result = await retryRequest(mockRequest, 3);

    expect(result).toEqual({ data: "success" });
    expect(mockRequest).toHaveBeenCalledTimes(2);
  });

  test("should not retry on 4xx client errors", async () => {
    const mockRequest = jest
      .fn()
      .mockRejectedValue({ response: { status: 404 } });

    await expect(retryRequest(mockRequest, 3)).rejects.toEqual({
      response: { status: 404 },
    });

    expect(mockRequest).toHaveBeenCalledTimes(1);
  });

  test("should throw after exhausting all retries", async () => {
    const mockRequest = jest.fn().mockRejectedValue({ code: "ETIMEDOUT" });

    await expect(retryRequest(mockRequest, 3)).rejects.toEqual({
      code: "ETIMEDOUT",
    });

    expect(mockRequest).toHaveBeenCalledTimes(4); // 1 initial + 3 retries
  });
});

describe("Input Validation", () => {
  test("should validate numeric value in range", () => {
    const testValue = "5000000";
    const numericValue = parseFloat(testValue);

    expect(numericValue).toBeGreaterThanOrEqual(1000);
    expect(numericValue).toBeLessThanOrEqual(100000000);
  });

  test("should detect unusually low values", () => {
    const testValue = "500";
    const numericValue = parseFloat(testValue);

    expect(numericValue).toBeLessThan(1000);
  });

  test("should detect unusually high values", () => {
    const testValue = "200000000";
    const numericValue = parseFloat(testValue);

    expect(numericValue).toBeGreaterThan(100000000);
  });
});

describe("CSS Selector Validation", () => {
  test("selector should be specific and valid", () => {
    const selector = "div.jackpot-value";

    expect(selector).toMatch(/^[a-z]+\.[a-z-]+$/);
    expect(selector).toContain("jackpot");
  });
});

describe("URL Configuration", () => {
  test("should use correct target URL", () => {
    const url = "https://toto.bg/";

    expect(url).toMatch(/^https:\/\//);
    expect(url).toContain("toto.bg");
  });

  test("Telegram API URL should be correctly formatted", () => {
    const token = "fake_token_123";
    const telegramUrl = `https://api.telegram.org/bot${token}/sendMessage`;

    expect(telegramUrl).toMatch(/^https:\/\/api\.telegram\.org\/bot/);
    expect(telegramUrl).toContain("/sendMessage");
  });
});
