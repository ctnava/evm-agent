const ethers = require('ethers');

module.exports = class Network {
	#setCurrency(nativeCurrency) {
		const { name, symbol, decimals } = nativeCurrency;
		if (typeof name !== 'string')
			throw new Error('Invalid nativeCurrency name');
		if (typeof symbol !== 'string')
			throw new Error('Invalid nativeCurrency symbol');
		if (typeof decimals !== 'number')
			throw new Error('Invalid nativeCurrency decimals');
		this.nativeCurrency = nativeCurrency;
	}

	#setRpc(rpc) {
		if (typeof rpc.public !== 'string') throw new Error('Invalid public rpc');
		if (typeof rpc.private !== 'string') throw new Error('Invalid private rpc');
		this.rpc = rpc;
	}

	#setExplorer(explorer) {
		const { name, url, api } = explorer;
		if (typeof name !== 'string') throw new Error('Invalid explorer name');
		if (typeof url !== 'string') throw new Error('Invalid explorer url');
		if (typeof api !== 'string') throw new Error('Invalid explorer api');
		this.explorer = explorer;
	}

	#setMultiCall(multicall) {
		const { address, blockCreated } = multicall;
		if (typeof address !== 'string' || !ethers.utils.isAddress(address))
			throw new Error('Invalid multicall address');
		if (typeof blockCreated !== 'number')
			throw new Error('Invalid multicall blockCreated');
		this.multicall = multicall;
	}

	#setEns(ens) {
		const { address } = ens;
		if (typeof address !== 'string' || !ethers.utils.isAddress(address))
			throw new Error('Invalid ens address');
		this.ens = ens;
	}

	constructor(data) {
		const { id, name, nativeCurrency, rpc, explorer } = data;
		this.id = id;
		this.name = name;
		this.#setCurrency(nativeCurrency);
		if (data.ens) this.#setEns(data.ens);
		if (data.multicall) this.#setMultiCall(data.multicall);
		this.#setRpc(rpc);
		this.#setExplorer(explorer);
		if (data.testnet) this.testnet = data.testnet;
	}

	info(guarded = false) {
		return {
			id: this.id,
			name: this.name,
			nativeCurrency: this.nativeCurrency,
			rpc: guarded ? this.rpc.public : this.rpc,
			explorer: guarded ? this.explorer.url : this.explorer,
			multicall: this.multicall,
			ens: this.ens,
			testnet: this.testnet,
		};
	}

	provider(url = this.rpc.private) {
		return new ethers.providers.JsonRpcProvider(url);
	}

	async #checkUrl(url) {
		try {
			const response = await fetch(url);
			if (response.status !== 200) return false;
			return true;
		} catch (err) {
			return false;
		}
	}

	async validate() {
		let net;

		net = await this.provider().getNetwork();
		if (!net) throw new Error(`Invalid private RPC: ${url}`);
		if (net.chainId !== this.id)
			throw new Error('private RPC chainId mismatch');

		net = await this.provider(this.rpc.public).getNetwork();
		if (!net) throw new Error(`Invalid public RPC: ${url}`);
		if (net.chainId !== this.id)
			throw new Error('private RPC chainId mismatch');

		let valid;
		const { url, api } = this.explorer;

		valid = await this.#checkUrl(url);
		if (!valid) throw new Error(`Invalid explorer url: ${url}`);

		valid = await this.#checkUrl(api);
		if (!valid) throw new Error(`Invalid explorer api: ${api}`);
	}
};
