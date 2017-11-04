var config = require('./config-truffle');
require('babel-register');

ProviderEngine = require('web3-provider-engine');
CacheSubprovider = require('web3-provider-engine/subproviders/cache.js');
FilterSubprovider = require('web3-provider-engine/subproviders/filters.js');
VmSubprovider = require('web3-provider-engine/subproviders/vm.js');
NonceSubprovider = require('web3-provider-engine/subproviders/nonce-tracker.js');
RpcSubprovider = require('web3-provider-engine/subproviders/rpc.js');
WalletSubprovider = require('web3-provider-engine/subproviders/wallet.js');
Web3Subprovider = require('web3-provider-engine/subproviders/web3.js');
Web3 = require('web3');

var engine = new ProviderEngine();
var web3 = new Web3(engine);

bip39 = require('bip39');
hdkey = require('ethereumjs-wallet/hdkey');

var mnemonic = config.seed;
var hdwallet = hdkey.fromMasterSeed(bip39.mnemonicToSeed(mnemonic));

var wallet_hdpath = config.hdpath;
var wallet = hdwallet.derivePath(wallet_hdpath + "0").getWallet();
var address = "0x" + wallet.getAddress().toString("hex");

providerUrl = 'https://ropsten.infura.io/';

engine.addProvider(new CacheSubprovider());
engine.addProvider(new FilterSubprovider());
engine.addProvider(new NonceSubprovider());
engine.addProvider(new VmSubprovider());
engine.addProvider(new WalletSubprovider(wallet, {}));
engine.addProvider(new Web3Subprovider(new Web3.providers.HttpProvider(providerUrl)));

engine.on('error', function(err) {
    console.error(err.stack);
});

console.log(address);

engine.start();

module.exports = {
    migrations_directory: "./migrations",
    networks: {
        ropsten: {
          network_id: 3,    // Official ropsten network id ropsten = 3, rinkeby = 4
          provider: engine,
          from: address,
          gas: 3000000,
          gasPrice: 200000000000
        },
        development: {
            host: "localhost",
            port: 8545,
            network_id: '*'
        }
    }
};