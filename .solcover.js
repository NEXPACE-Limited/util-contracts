module.exports = {
  silent: true,
  skipFiles: [
    "mock/internal",
    "node_modules",
  ],
  mocha: {
    reporter: "dot",
  },
};
