const path = require('path');

module.exports = {
  entry: {
    client: './dist/client/index.js', // Path to the Vite build output
    server: './dist/server.js', // Path to the compiled server file
  },
  externals: {
    // Need this to avoid error when working with Express
    express: 'commonjs express',
  },
  node: {
    // Need this when working with express, otherwise the build fails
    __dirname: false, // if you don't put this is, __dirname
    __filename: false, // and __filename return blank or /
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  target: 'node', // Target node environment
};
