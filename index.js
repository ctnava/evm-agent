const fs = require('fs');
if (!fs.existsSync('./config/evm')) fs.mkdirSync('./config/evm');
if (!fs.existsSync('./config/evm/networks.json')) {
	const defaultNetworks = require('./defaultConfig.json');
	fs.writeFileSync(
		'./config/evm/networks.json',
		JSON.stringify(defaultNetworks, null, 2)
	);
}

const EvmAgent = require('./src');

module.exports = EvmAgent;
