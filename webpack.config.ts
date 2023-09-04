module.exports = {
  // ...
  module: {
    rules: [
      {
        test: /\.tsx?$/, // Match TypeScript files
        exclude: /node_modules/,
        use: "ts-loader", // Use the ts-loader
      },
      // Other rules for handling different file types
    ],
  },
  // ...
};
