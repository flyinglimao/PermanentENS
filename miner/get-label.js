const ethers = require("ethers");

console.log(ethers.utils.keccak256(ethers.utils.toUtf8Bytes(process.argv[2])))