const FileWatcher = require('@ctnava/file-watcher');
const ethers = require('ethers');

const Wallet = require('./Wallet');
const Network = require('./Network');

const uint = (x) => parseInt(x.toString());

module.exports = class EvmAgent extends FileWatcher {
	egress() {
		super.egress();
		delete this.connection;

		let connections = {};
		Object.keys(this.data).forEach((alias) => {
			const entry = new Network(this.data[alias]);

			connections[alias] = entry;
			connections[alias].signer = new ethers.Wallet(
				this.wallet ? this.wallet.key : new Wallet().key,
				entry.provider()
			);
		});

		this.connection = connections;
	}

	constructor() {
		super('./config/evm/networks.json');
		this.wallet = new Wallet();
		this.egress();
	}

	info(alias, guarded = false) {
		return this.connection[alias].info(guarded);
	}

	provider(alias) {
		return this.connection[alias].provider();
	}

	signer(alias) {
		return this.connection[alias].signer;
	}

	explorer(alias) {
		return this.connection[alias].explorer.url;
	}

	async balance(alias, address) {
		return uint(await this.provider(alias).getBalance(address));
	}

	ingress() {
		super.ingress(this.data);
		this.egress();
	}

	async register(alias, values) {
		const entry = new Network(values);
		await entry.validate();
		this.data[alias] = values;
		this.ingress();
	}

	remove(alias) {
		delete this.data[alias];
		this.ingress();
	}

	async gasPrice(alias, printMe = false) {
		const provider = this.provider(alias);
		let result;

		let feeData = await provider.getFeeData();
		Object.keys(feeData).forEach((key) => (feeData[key] = uint(feeData[key])));
		if (feeData.maxFeePerGas) result = feeData.maxFeePerGas;
		else result = uint(await provider.getGasPrice());

		if (printMe) console.log('feeData', feeData);
		return result;
	}

	async gasLimit(
		opts = {
			// contract:{},
			// method: "",
			// args: [],
		}
	) {
		let limit = 21000;
		if (!opts.contract) return limit;
		const { contract, method, args } = opts;
		limit = await contract.estimateGas[method](...args);
		return uint(limit);
	}

	async feeEstimate(alias, opts = {}, printMe = false) {
		const price = await this.gasPrice(alias);
		const limit = await this.gasLimit(opts);
		const estimate = price * limit;

		if (printMe) {
			console.log('gas price', price);
			console.log('gas limit', limit);
			console.log('estimated tx fee', estimate);
		}
		return estimate;
	}
};
