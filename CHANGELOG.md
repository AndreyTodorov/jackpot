# Changelog

All notable changes to this project will be documented in this file.

## [1.1.0] - 2025-11-16

### 🔴 Critical Fixes

- **Fixed broken text cleaning logic** that was corrupting jackpot values
  - Previous regex `replace(/[^\d.,]/g, " лв.")` was replacing ALL non-digit characters with " лв."
  - Now properly normalizes whitespace and adds currency suffix once
  - Example fix: `"5 000 000 лева"` → `"5 000 000 лв."` (instead of corrupted output)

- **Fixed URL parameter injection vulnerability** in Telegram API calls
  - Changed from unsafe query string concatenation to secure POST body
  - Previously: URL params could be injected through scraped content
  - Now: Using axios POST with JSON body for safe parameter handling

- **Fixed incorrect cron schedule timing**
  - Previous: `"0 9 * * 0,4"` (09:00 UTC = wrong time for Bulgaria)
  - Now: `"0 12 * * 0,4"` (12:00 UTC = 14:00-15:00 Bulgaria time)

### ✨ New Features

- **Request timeout protection** (30 seconds)
  - Prevents infinite hanging on slow/unresponsive servers
  - Applies to both web scraping and Telegram API calls

- **Retry logic with exponential backoff**
  - Automatically retries failed requests up to 3 times
  - Handles transient network errors (timeouts, DNS failures, 5xx errors)
  - Uses exponential backoff (2s, 4s, 8s delays)

- **CSS selector validation**
  - Checks if `div.jackpot-value` element exists before parsing
  - Provides clear error message if website structure changes

- **Input validation for scraped values**
  - Validates that cleaned value contains digits
  - Warns about unusually low (<1,000 BGN) or high (>100M BGN) values
  - Prevents sending garbage data to Telegram

- **Enhanced error logging**
  - Logs error type, message, HTTP status, response data
  - Includes error codes for network failures
  - Outputs full stack traces for debugging

- **User-Agent header**
  - Added browser-like User-Agent to avoid potential bot blocking

### 📚 Documentation

- **Comprehensive README.md**
  - Installation instructions
  - Configuration guide
  - Troubleshooting section
  - GitHub Actions setup guide
  - Project structure overview

- **Complete package.json metadata**
  - Added description, keywords, repository URL
  - Added author and homepage links
  - Added bug tracker URL
  - Specified Node.js version requirement (>=20.0.0)

- **Environment variable template**
  - Created `.env.example` with clear instructions
  - Documents required Telegram credentials

- **CHANGELOG.md** (this file)
  - Documents all improvements and fixes

### 🧪 Testing

- **Jest test suite** with 15+ test cases
  - Text cleaning function tests
  - Retry logic tests
  - Input validation tests
  - Configuration validation tests
  - Message formatting tests

- **Test scripts** in package.json
  - `npm test` - Run test suite
  - `npm run test:watch` - Watch mode for development
  - `npm run test:coverage` - Generate coverage report

### 🔧 Code Quality

- **Removed dead code**
  - Removed commented-out `node-telegram-bot-api` import

- **Better code organization**
  - Extracted helper functions: `retryRequest()`, `cleanJackpotValue()`, `sendTelegramMessage()`
  - Added JSDoc comments for all functions
  - Improved variable naming and constants

- **Enhanced .gitignore**
  - Added coverage directories
  - Added IDE/editor files
  - Added log files
  - Added OS-specific files

### 🎨 Improvements

- **Better console output**
  - More informative log messages
  - Emoji indicators for different stages
  - Clearer error messages with context

- **Script commands**
  - Added `npm start` command
  - Added test commands
  - Improved workflow for development

## [1.0.0] - Initial Release

- Basic web scraping functionality
- Telegram notifications
- GitHub Actions integration
