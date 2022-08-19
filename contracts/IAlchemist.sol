// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface Alchemist {
    function mintFrom(
        address owner,
        uint256 amount,
        address recipient
    ) external;
}