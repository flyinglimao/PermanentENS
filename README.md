# PermantentENS

PermantentENS is a proejct of [Money Legos Hackathon](https://gitcoin.co/hackathon/moneylegos/). With PermantentENS, people can pay renew fee with yield from many protocols. It based on [Alchemix](https://alchemix.fi).

## How do I use it?

1. Registers an ENS on [ENS](https://ens.domain) or via PermantentENS
2. Deposit a certain amount of USD tokens Alchemix
3. Approve PermantentENS to mint debt for you
4. (Optional) Approve PermantentENS to withdraw collateral for you when mintable debt isn't enough to pay the fee

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

Before deploying into mainnet, modify `hardhat.config.js` to specify the RPC endpoint, account, and any other things. Then, run `yarn deploy` to deploy a contract.
If you're deploying to the hardhat fork, you can run `yarn impersonate-whitelist <deployed-address>` to whitelist the deployed contract.

### Web

The web is built with React.

#### Browser Setup

To run the web app, the contract need to be deployed and whitelist, hence you might need to run `yarn node`, which will start a fork. Then, deploy and whitelist the contract with mentioned commands.

#### Init and start

1. `cd web`
2. `yarn install`
3. `yarn start`

#### Build

After running `yarn build`, the built files will locate in `./web/dist`
