var webpack = require ('webpack');

module.exports = {
  devtool: "eval-source-maps",
  entry:  __dirname + "/src/index.js",
  output: {
    path: __dirname + "/public/js/bundle",
    filename: "jibe.js"
  },

  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        loader: 'babel'
      }
    ]
  },

  resolve: {
    extensions: ['', '.js', '.jsx']
  }
};
