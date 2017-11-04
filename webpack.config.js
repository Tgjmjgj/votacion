const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');

module.exports = {
  entry: './app/javascripts/app.js',
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: 'app.js'
  },
  plugins: [
    new UglifyJSPlugin(),
    new CopyWebpackPlugin([
        { from: './app/index.html', to: "index.html" },
        { from: './app/style.css', to: "style.css" },
        { from: './app/fonts/fonts.css', to: "fonts/fonts.css" },
        { from: './app/fonts/dsdigital.eot', to: "fonts/dsdigital.eot" },
        { from: './app/fonts/dsdigital.woff', to: "fonts/dsdigital.woff" },
        { from: './app/fonts/dsdigital.ttf', to: "fonts/dsdigital.ttf" },
        { from: './app/fonts/dsdigital.svg', to: "fonts/dsdigital.svg" },
        { from: './app/img/bg1.jpg', to: "img/bg1.jpg" },
        { from: './app/img/favicon.png', to: "img/favicon.png" },
        { from: './app/img/loading.gif', to: "img/loading.gif" },
        { from: './app/img/logo1.png', to: "img/logo1.png" },
        { from: './app/img/wallet1.png', to: "img/wallet1.png" },
        { from: './app/img/wallet2.png', to: "img/wallet2.png" },
        { from: './app/img/boton_Candidato1.png', to: "img/boton_Candidato1.png" },
        { from: './app/img/boton_Candidato2.png', to: "img/boton_Candidato2.png" },
        { from: './app/img/boton_Ninguno.png', to: "img/boton_Ninguno.png" },
        { from: './app/javascripts/web3.min.js', to: "web3.min.js" },
        { from: './app/javascripts/wallet.js', to: "wallet.js" },
        { from: './app/javascripts/async.min.js', to: "async.min.js" },
        { from: './app/javascripts/ethjs-provider-signer.min.js', to: "ethjs-provider-signer.min.js" },
        { from: './app/javascripts/lightwallet.min.js', to: "lightwallet.min.js" },
    ])
  ],
  module: {
    rules: [
      {
       test: /\.css$/,
       use: [ 'style-loader', 'css-loader' ]
      }
    ],
    loaders: [
      { test: /\.json$/, use: 'json-loader' },
      
      { test: /\.sol/, loader: 'truffle-solidity' },

      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        loader: 'babel-loader',
        query: {
          presets: ['es2015'],
          plugins: ['transform-runtime']
        }
      }
    ]
  }
}
