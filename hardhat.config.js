const { whitelist } = require('./scripts/whitelist');
const { TASK_NODE_SERVER_READY } = require('hardhat/builtin-tasks/task-names');

require('dotenv').config();
require('@nomicfoundation/hardhat-toolbox');

subtask(TASK_NODE_SERVER_READY).setAction(async (taskArgs, hre, runSuper) => {
  await runSuper();
  const factory = await hre.ethers.getContractFactory('PermantentENS');
  const contract = await factory.deploy();
  await whitelist(hre, contract.address);
  console.log(`PermantentDNS is deployed at ${contract.address}`);
});

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: '0.8.16',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      forking: {
        url: process.env.RPC_URL,
      },
    },
  },
  mocha: {
    timeout: 120000,
  },
};
