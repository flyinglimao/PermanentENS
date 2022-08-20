# PermanentENS

PermanentENS is a proejct of [Money Legos Hackathon](https://gitcoin.co/hackathon/moneylegos/). With PermanentENS, people can pay renew fee with yield from many protocols. It based on [Alchemix](https://alchemix.fi).

## How do I use it?

1. Registers an ENS on [ENS](https://ens.domain) or via PermanentENS
2. Deposit a certain amount of USD tokens Alchemix
3. Approve PermanentENS to mint debt for you
4. (Optional) Approve PermanentENS to withdraw collateral for you when mintable debt isn't enough to pay the fee

## Developement

### Contract

This project is built with [Hardhat](https://hardhat.org).

#### Init

1. `yarn install`: Install necessary dependencies
2. `cp .env.example .env`: Create an env config file
3. `vim .env`: Modify the config file (with an editor you like)

#### Test

`yarn test` will test all functions. Before testing, the env variable RPC_URL is required to fork Ethereum mainnet.

#### Deploy

Before deploying into mainnet, modify `hardhat.config.js` to specify the RPC endpoint, account, and any other things. Then, run `yarn deploy` (remeber to add `--network`) to deploy a contract.

#### Deploy to local fork

You can start a local fork with `yarn start`, which will deploy and whitelist PermanentENS when booting the network.

Here are some useful commands can be used after start the fork (add `--network localhost` after each command):

- `yarn register-ens --domain <domain> [--owner <owner>] [--duration <duration>]`: Register a ENS. If owner isn't set, the first signer is applied. If duration isn't set, 28 days is applied.
- `yarn mint-usdt --amount <amount> [--receiver <receiver>]`: Issue some USDT to an address
- `yarn deposit-usdt --amount <amount> --contract <PermanentENS address> [--depositer <depositer>]`: Deposit USDT to Alchemix and approve.

### Web

The web is built with React.

#### Browser Setup

Before start the web app, you should start local fork with `yarn start` and your wallet. If you had modified JSON-RPC server, you will have to modify config of the web app, too.

#### Init and start

1. `cd web`
2. `yarn install`
3. `yarn start`

#### Build

After running `yarn build`, the built files will locate in `./web/dist`
