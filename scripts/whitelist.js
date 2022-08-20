
const ALCHEMIST = '0x5C6374a2ac4EBC38DeA0Fc1F8716e5Ea1AdD94dd';
const ALCHEMIST_ABI = [
  'function whitelist() external view returns (address)',
  'function depositUnderlying(address yieldToken, uint256 amount, address recipient, uint256 minimumAmountOut) external returns (uint256)',
  'function approveMint(address spender, uint256 amount) external',
];
const WHITELIST_ABI = [
  'function owner() external view returns (address)',
  'function add(address) external',
];

async function whitelist({ ethers }, address) {
  // add PermantentENS to whitelist
  const alchemist = new ethers.Contract(
    ALCHEMIST,
    ALCHEMIST_ABI,
    ethers.provider,
  );
  const whitelistContractAddress = await alchemist.whitelist();
  const whitelist = new ethers.Contract(
    whitelistContractAddress,
    WHITELIST_ABI,
    ethers.provider
  );
  const whitelistAdmin = await whitelist.owner();
  await hre.network.provider.request({
    method: 'hardhat_impersonateAccount',
    params: [whitelistAdmin],
  });
  await whitelist
    .connect(await ethers.getSigner(whitelistAdmin))
    .add(address);
}

module.exports = { whitelist }