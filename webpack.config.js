module.exports = {
  devtool: 'eval-source-map',
  entry:  __dirname + "/src/socket.js",
  output: {
    path: __dirname + "/public",
    publicPath: 'http://localhost:3000/public/',
    filename: "socket.js",
    libraryTarget: "umd"
  },

  module: {
    rules: [
        {
            test: /(\.js)$/,
            use: {
                loader: "babel-loader",
            },
            exclude: /node_modules/
        }
    ]
  }
}
