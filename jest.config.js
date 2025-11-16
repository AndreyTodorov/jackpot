module.exports = {
  // Test environment
  testEnvironment: "node",

  // Coverage configuration
  collectCoverageFrom: ["jackpot.js"],

  // Test match patterns
  testMatch: ["**/*.test.js"],

  // Coverage thresholds (optional - uncomment to enforce)
  // coverageThreshold: {
  //   global: {
  //     branches: 70,
  //     functions: 70,
  //     lines: 70,
  //     statements: 70,
  //   },
  // },

  // Verbose output
  verbose: true,
};
