const ENS_REGISTRAR_CONTROLLER = '0x283Af0B28c62C092C9727F1Ee09c02CA627EB7F5';
const ENS_REGISTRAR_CONTROLLER_ABI = [
  'function makeCommitment(string memory name, address owner, bytes32 secret) pure public returns(bytes32)',
  'function commit(bytes32 commitment) public',
  'function register(string calldata name, address owner, uint duration, bytes32 secret) external payable',
  'function rentPrice(string memory name, uint duration) view public returns(uint)',
];

async function registerENS({ ethers }, name, initDuration, signer) {
  const ens = new ethers.Contract(
    ENS_REGISTRAR_CONTROLLER,
    ENS_REGISTRAR_CONTROLLER_ABI,
    signer
  );
  this.ens = ens;
  const commit = await ens.makeCommitment(
    name,
    signer.address,
    ethers.constants.HashZero
  );
  await ens.commit(commit);
  await network.provider.send('evm_increaseTime', [60]);
  await network.provider.send('evm_mine');
  await ens.register(
    name,
    signer.address,
    initDuration,
    ethers.constants.HashZero,
    { value: await ens.rentPrice(name, initDuration) }
  );
}

module.exports = { registerENS };
