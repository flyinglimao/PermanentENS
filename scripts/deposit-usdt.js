const { ethers } = require('ethers');

const ALCHEMIST = '0x5C6374a2ac4EBC38DeA0Fc1F8716e5Ea1AdD94dd';
const ALCHEMIST_ABI = [
  'function depositUnderlying(address yieldToken, uint256 amount, address recipient, uint256 minimumAmountOut) external returns (uint256)',
  'function approveMint(address spender, uint256 amount) external',
];
async function depositUSDT(amount, signer, permantentENS) {
  const alchemist = new ethers.Contract(ALCHEMIST, ALCHEMIST_ABI, signer);

  await alchemist.depositUnderlying(
    '0x7Da96a3891Add058AdA2E826306D812C638D87a7',
    amount,
    signer.address,
    1
  );
  await alchemist.approveMint(permantentENS, ethers.constants.MaxUint256);
}

module.exports = { depositUSDT };
