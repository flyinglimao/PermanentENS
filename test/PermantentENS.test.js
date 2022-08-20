const { use, expect } = require('chai');
const { ethers } = require('hardhat');
const chaiAsPromised = require('chai-as-promised');
use(chaiAsPromised);

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
const ENS_REGISTRAR_CONTROLLER = '0x283Af0B28c62C092C9727F1Ee09c02CA627EB7F5';
const ENS_REGISTRAR_CONTROLLER_ABI = [
  'function makeCommitment(string memory name, address owner, bytes32 secret) pure public returns(bytes32)',
  'function commit(bytes32 commitment) public',
  'function register(string calldata name, address owner, uint duration, bytes32 secret) external payable',
  'function rentPrice(string memory name, uint duration) view public returns(uint)',
];
const ENS_REGISTRAR = '0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85';
const ENS_REGISTRAR_ABI = [
  'function nameExpires(uint256 id) external view returns(uint)',
];
const USDT_ADDRESS = '0xdAC17F958D2ee523a2206206994597C13D831ec7';
const USDT_OWNER = '0xC6CDE7C39eB2f0F0095F41570af89eFC2C1Ea828';
const USDT_ABI = [
  'function issue(uint amount) public',
  'function transfer(address to, uint value) public',
  'function approve(address spender, uint value) public',
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
    const alchemist = new ethers.Contract(
      ALCHEMIST,
      ALCHEMIST_ABI,
      this.signers[0]
    );
    this.alchemist = alchemist;
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
      .add(this.contract.address);

    // register a ENS domain
    const ens = new ethers.Contract(
      ENS_REGISTRAR_CONTROLLER,
      ENS_REGISTRAR_CONTROLLER_ABI,
      this.signers[0]
    );
    this.ens = ens;
    const commit = await ens.makeCommitment(
      ENS_NAME,
      this.signers[0].address,
      ethers.constants.HashZero
    );
    await ens.commit(commit);
    await network.provider.send('evm_increaseTime', [60]);
    await network.provider.send('evm_mine');
    await ens.register(
      ENS_NAME,
      this.signers[0].address,
      DURATION,
      ethers.constants.HashZero,
      { value: await ens.rentPrice(ENS_NAME, DURATION) }
    );

    // deposit into Alchemix
    await hre.network.provider.request({
      method: 'hardhat_impersonateAccount',
      params: [USDT_OWNER],
    });
    const usdt = new ethers.Contract(
      USDT_ADDRESS,
      USDT_ABI,
      await ethers.getSigner(USDT_OWNER)
    );
    const usdtAmount = ethers.utils.parseUnits('1000000', 6);
    await usdt.issue(usdtAmount);
    await usdt.transfer(this.signers[1].address, usdtAmount);
    await usdt.connect(this.signers[1]).approve(ALCHEMIST, usdtAmount);
    await alchemist
      .connect(this.signers[1])
      .depositUnderlying(
        '0x7Da96a3891Add058AdA2E826306D812C638D87a7',
        usdtAmount,
        this.signers[1].address,
        1
      );
    await alchemist
      .connect(this.signers[1])
      .approveMint(this.contract.address, ethers.constants.MaxUint256);

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
