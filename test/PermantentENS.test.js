const { ethers } = require("hardhat");

describe("PermantentENS", function () {
    before(async () => {
        const factory = ethers.getContractFactory("PermantentENS")
        this.contract = await factory.deploy()

    })
})