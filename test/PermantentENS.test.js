const { use, expect } = require('chai');
const { ethers } = require('hardhat');
const chaiAsPromised = require('chai-as-promised');
const { whitelist } = require('../scripts/whitelist');
const { registerENS } = require('../scripts/register-ens');
const { mintUSDT, USDT } = require('../scripts/mint-usdt');
const { depositUSDT } = require('../scripts/deposit-usdt');
use(chaiAsPromised);

const ALCHEMIST = '0x5C6374a2ac4EBC38DeA0Fc1F8716e5Ea1AdD94dd';
const ENS_REGISTRAR = '0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85';
const ENS_REGISTRAR_ABI = [
  'function nameExpires(uint256 id) external view returns(uint)',
];
const DURATION = 86400 * 28;
const ENS_NAME = 'permantentensdemo';
const ENS_LABEL = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(ENS_NAME));

describe('PermantentENS', function () {
  before(async () => {
    const factory = await ethers.getContractFactory('PermantentENS');
    this.contract = await factory.deploy();
    this.signers = await ethers.getSigners();

    // add PermantentENS to whitelist
    await whitelist({ ethers }, this.contract.address);

    // register a ENS domain
    await registerENS({ ethers }, ENS_NAME, DURATION, this.signers[0]);

    // deposit into Alchemix
    const usdtAmount = ethers.utils.parseUnits('1000000', 6);
    await mintUSDT(hre, this.signers[1].address, usdtAmount);
    await USDT.connect(this.signers[1]).approve(ALCHEMIST, usdtAmount);
    await depositUSDT(usdtAmount, this.signers[1], this.contract.address)

    // other setup
    this.ensRegistrar = new ethers.Contract(
      ENS_REGISTRAR,
      ENS_REGISTRAR_ABI,
      ethers.provider
    );
  });

  beforeEach(async () => {
    this.snapshot = await network.provider.send('evm_snapshot', []);
  });

  afterEach(async () => {
    await network.provider.send('evm_revert', [this.snapshot]);
  });

  it('Signer[1] enable a config', async () => {
    const enableTxRes = await this.contract
      .connect(this.signers[1])
      .enable(ENS_NAME, DURATION * 12);

    const enableTxReceipt = await enableTxRes.wait();
    const newConfigEvent = enableTxReceipt.events[0];

    expect(newConfigEvent.args.label).equals(ENS_LABEL);
    expect(newConfigEvent.args.config_idx).equals(ethers.BigNumber.from(0));
  });

  it('Signer[2] can mine a config', async () => {
    await this.contract
      .connect(this.signers[1])
      .enable(ENS_NAME, DURATION * 12);

    const beforeMineExpiry = await this.ensRegistrar.nameExpires(ENS_LABEL);
    const mineTxRes = await this.contract
      .connect(this.signers[2])
      .mine(ENS_LABEL, 0, DURATION);

    const mineTxReceipt = await mineTxRes.wait();
    const renewConfigEvent = mineTxReceipt.events.find(
      (evt) => evt.event === 'RenewedConfig'
    );
    const afterMineExpiry = await this.ensRegistrar.nameExpires(ENS_LABEL);

    expect(renewConfigEvent.args.label).equals(ENS_LABEL);
    expect(renewConfigEvent.args.duration).equals(
      ethers.BigNumber.from(DURATION)
    );
    expect(renewConfigEvent.args.new_expiry).equals(afterMineExpiry);
    expect(afterMineExpiry.sub(beforeMineExpiry)).equals(
      ethers.BigNumber.from(DURATION)
    );
  });

  it('Signer[2] cannot mine a config that exceed the max duration', async () => {
    await this.contract
      .connect(this.signers[1])
      .enable(ENS_NAME, DURATION * 12);

    await expect(
      this.contract.connect(this.signers[2]).mine(ENS_LABEL, 0, DURATION * 13)
    ).eventually.to.be.rejected;
  });

  it('Signer[1] disable a config and Signer[2] cannot mine the config', async () => {
    await this.contract
      .connect(this.signers[1])
      .enable(ENS_NAME, DURATION * 12);

    await this.contract.connect(this.signers[1]).disable(ENS_LABEL, 0);

    await expect(
      this.contract.connect(this.signers[2]).mine(ENS_LABEL, 0, DURATION)
    ).eventually.to.be.rejected;
  });

  it('Signer[1] enable a config and owner (Signer[0]) disable the config', async () => {
    await this.contract
      .connect(this.signers[1])
      .enable(ENS_NAME, DURATION * 12);

    await this.contract.disable(ENS_LABEL, 0); // disable as owner of the ENS domain

    await expect(
      this.contract.connect(this.signers[2]).mine(ENS_LABEL, 0, DURATION)
    ).eventually.to.be.rejected;
  });
});
