require("dotenv").config();
const ethers = require("ethers");

const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const contract = new ethers.Contract(
  process.env.CONTRACT,
  [
    "function configs(bytes32 label, uint256 config_idx) external view returns (string name, address payer, uint256 max_duration, bool disabled)",
    "function mine(bytes32 label, uint256 config_idx, uint256 duration) external",
  ],
  signer
);
const ens = new ethers.Contract(
  "0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85",
  ["function nameExpires(uint256 id) external view returns(uint)"],
  signer
);

async function main() {
  const label = process.argv[2];
  const config_idx = process.argv[3];
  const duration = process.argv[4];

  const config = await contract.configs(label, config_idx);
  const nameExpires = await ens.nameExpires(label);
  
  const remain = nameExpires.sub(Math.floor(new Date().getTime() / 1000))
  if (remain.add(duration).gte(config.max_duration)) {
    console.log('Nothing to do')
  } else {
    const tx = await contract.mine(label, config_idx, duration);
    console.log(tx.hash)
    await tx.wait()
  }
}
main();
