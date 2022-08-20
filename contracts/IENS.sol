// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface ETHRegistrarController {
    function renew(string calldata name, uint256 duration) external payable;

    function rentPrice(string memory name, uint256 duration)
        external
        view
        returns (uint256);
}

interface ENSRegistrar {
    function nameExpires(uint256 id) external view returns (uint256);

    function ownerOf(uint256 id) external view returns (address);
}

interface ENSPriceOracle {
    function rentPrices(uint256 len) external view returns (uint256);
}