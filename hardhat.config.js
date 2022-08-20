const { whitelist } = require('./scripts/whitelist');
const { TASK_NODE_SERVER_READY } = require('hardhat/builtin-tasks/task-names');
const { registerENS } = require('./scripts/register-ens');
const { mintUSDT, USDT } = require('./scripts/mint-usdt');
const { depositUSDT } = require('./scripts/deposit-usdt');

require('dotenv').config();
require('@nomicfoundation/hardhat-toolbox');

subtask(TASK_NODE_SERVER_READY).setAction(async (taskArgs, hre, runSuper) => {
  await runSuper();
  const factory = await hre.ethers.getContractFactory('PermanentENS');
  const contract = await factory.deploy();
  await whitelist(hre, contract.address);
  console.log(`PermanentDNS is deployed at ${contract.address}`);
});

task('register-ens', 'Register a ENS')
  .addParam('domain', 'The name to register')
  .addOptionalParam('owner', 'The owner of this domain', 'Account[0]')
  .addOptionalParam(
    'duration',
    'The duration of this domain',
    (86400 * 28).toString()
  )
  .setAction(async ({ domain, owner, duration }, { ethers }) => {
    const signer =
      owner !== 'Account[0]'
        ? await ethers.getSigner(owner)
        : (await ethers.getSigners())[0];
    return registerENS({ ethers }, domain, parseInt(duration), signer);
  });

task('mint-usdt', 'Mint some USDT')
  .addParam('amount', 'The amount to mint')
  .addOptionalParam('receiver', 'The receiver of minted tokens', 'Account[0]')
  .setAction(async ({ amount, receiver }, { ethers }) => {
    const receiverAddress =
      receiver !== 'Account[0]'
        ? receiver
        : (await ethers.getSigners())[0].address;
    return mintUSDT(hre, receiverAddress, amount);
  });

task('deposit-usdt', 'Mint some USDT')
  .addParam('amount', 'The amount to mint')
  .addParam('contract', 'The address of deployed PermanentENS')
  .addOptionalParam('depositer', 'The depositer of minted tokens', 'Account[0]')
  .addOptionalParam(
    'alchemist',
    'The address of Alchemist',
    '0x5C6374a2ac4EBC38DeA0Fc1F8716e5Ea1AdD94dd'
  )
  .setAction(async ({ amount, contract, depositer, alchemist }, { ethers }) => {
    const signer =
      depositer !== 'Account[0]'
        ? await ethers.getSigner(depositer)
        : (await ethers.getSigners())[0];
    await USDT.connect(signer).approve(alchemist, amount);
    await depositUSDT(amount, signer, contract);
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
