const FileWatcher = require('@ctnava/file-watcher');
const ethers = require('ethers');

module.exports = class Wallet extends FileWatcher {
	extract() {
		this.key = this.data.privateKey;
		this.address = new ethers.Wallet(this.key).address;
	}

	create() {
		const wallet = ethers.Wallet.createRandom();
		const signingKey = wallet._signingKey();
		super.ingress(signingKey);
	}

	constructor() {
		super('./config/evm/wallet.json');
		if (!this.data.privateKey) this.create();
		this.extract();
	}
};
