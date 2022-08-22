require("dotenv").config();
const ethers = require("ethers");

const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
const contract = new ethers.Contract(
  process.env.CONTRACT,
  [
    "event NewConfig(bytes32 indexed label, address indexed payer, uint config_idx)",
    "event DisableConfig(bytes32 indexed label, address indexed payer, uint config_idx)",
  ],
  provider
);

async function main() {
  const [newConfigs, disabeConfigs] = await Promise.all([
    contract.queryFilter(contract.filters.NewConfig()),
    contract.queryFilter(contract.filters.DisableConfig()),
  ]);

  const configs = newConfigs
    .map((e) => e.args)
    .filter(
      (e, idx, array) =>
        array.findIndex(
          (f) =>
            f.label === e.label &&
            f.config_idx.toNumber() === e.config_idx.toNumber()
        ) === idx
    )
    .filter(
      (evt) =>
        !disabeConfigs.some(
          (e) =>
            e.args.label === evt.label &&
            e.args.config_idx.toNumber() === evt.config_idx.toNumber()
        )
    );

    for (const config of configs) {
    console.log(`${config.label}\t${config.config_idx}`)
    }
}
main();
