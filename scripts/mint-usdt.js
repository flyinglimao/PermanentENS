const { ethers } = require('hardhat');

const USDT_ADDRESS = '0xdAC17F958D2ee523a2206206994597C13D831ec7';
const USDT_OWNER = '0xC6CDE7C39eB2f0F0095F41570af89eFC2C1Ea828';
const USDT_ABI = [
  'function issue(uint amount) public',
  'function transfer(address to, uint value) public',
  'function approve(address spender, uint value) public',
];

const USDT = new ethers.Contract(USDT_ADDRESS, USDT_ABI);

async function mintUSDT(hre, target, amount) {
  await hre.network.provider.request({
    method: 'hardhat_impersonateAccount',
    params: [USDT_OWNER],
  });
  const usdt = USDT.connect(await ethers.getSigner(USDT_OWNER))
  await usdt.issue(amount);
  await usdt.transfer(target, amount);
}

module.exports = { mintUSDT, USDT };
