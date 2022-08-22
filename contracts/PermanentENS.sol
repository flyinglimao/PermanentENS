// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./IENS.sol";
import "./IAlchemist.sol";
import "./IPermanentENS.sol";
import "./IUniswap.sol";

import "hardhat/console.sol";

contract PermanentENS is IPermanentENS, Ownable {
    ETHRegistrarController constant ens_controller =
        ETHRegistrarController(0x283Af0B28c62C092C9727F1Ee09c02CA627EB7F5);
    ENSRegistrar constant ens_registrar =
        ENSRegistrar(0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85);
    ENSPriceOracle constant ens_price_oracle =
        ENSPriceOracle(0xB9d374d0fE3D8341155663FaE31b7BeAe0aE233A);
    UniswapV2Router constant sushi_router =
        UniswapV2Router(0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F);
    Alchemist constant alchemist =
        Alchemist(0x5C6374a2ac4EBC38DeA0Fc1F8716e5Ea1AdD94dd);
    IWETH constant weth = IWETH(0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2);
    IERC20 constant ALUSD = IERC20(0xBC6DA0FE9aD5f3b0d58160288917AA56653660E9);

    /// @notice The max fee when an user trigger renew for other one, divided by 100000
    ///
    /// @dev The miner receive will be `price * miner fee - swap fee`, hence miners can use some ways to reduce the slippage to increase their profit
    uint256 public constant miner_fee = 10000 + 100000; /* fee + base */
    /// @notice The slippage allowed when swap, divided by 100000
    uint256 public constant swap_fee = 5000 + 100000; /* fee (3%) + slippage (2%) + base */

    /// @inheritdoc IPermanentENS
    mapping(bytes32 => Config[]) public configs;

    address[] swap_path = [address(ALUSD), address(weth)];

    constructor() {
        unchecked {
            ALUSD.approve(address(sushi_router), uint256(0) - 1);
        }
    }

    /// @inheritdoc IPermanentENS
    function enable(string calldata name, uint256 max_duration) external {
        bytes32 label = keccak256(abi.encodePacked(name));
        Config memory config = Config({
            name: name,
            payer: msg.sender,
            max_duration: max_duration,
            disabled: false
        });
        emit NewConfig(label, msg.sender, configs[label].length);
        configs[label].push(config);
    }

    /// @inheritdoc IPermanentENS
    function disable(bytes32 label, uint256 config_idx) external {
        Config memory config = configs[label][config_idx];
        require(
            (!configs[label][config_idx].disabled &&
                msg.sender == config.payer) ||
                msg.sender == ens_registrar.ownerOf(uint256(label)),
            "Not allowed"
        );
        configs[label][config_idx].disabled = true;
        emit DisableConfig(label, config.payer, config_idx);
    }

    /// @inheritdoc IPermanentENS
    function mine(
        bytes32 label,
        uint256 config_idx,
        uint256 duration
    ) external {
        Config memory config = configs[label][config_idx];
        uint256 new_expiry = ens_registrar.nameExpires(
            uint256(keccak256(abi.encodePacked(config.name)))
        ) + duration;
        require(!config.disabled, "Config disabled");
        // name expire + extend length < current + max_duration
        require(
            new_expiry <= block.timestamp + config.max_duration,
            "Extend too long"
        );

        // compute the alUSD required to pay renew fee and miner fee
        uint256 renew_price_wei = ens_controller.rentPrice(
            config.name,
            duration
        ); // in eth
        uint256 name_length = strlen(config.name);
        uint256 renew_price_usd = ens_price_oracle.rentPrices(
            (name_length > 5 ? 5 : name_length) - 1
        ) * duration; // in usd
        uint256 usd_amount = (renew_price_usd * miner_fee) / 100000;
        uint256 usd_swap_amount = (renew_price_usd * swap_fee) / 100000;
        alchemist.mintFrom(config.payer, usd_amount, address(this));

        // swap alUSD to ETH
        uint256 spend = sushi_router.swapTokensForExactETH(
            renew_price_wei,
            usd_swap_amount,
            swap_path,
            address(this),
            block.timestamp
        )[0];

        // renew ens
        ens_controller.renew{value: renew_price_wei}(config.name, duration);
        emit RenewedConfig(label, duration, new_expiry);

        // pay miner fee
        ALUSD.transfer(msg.sender, usd_amount - spend);
    }

    receive() external payable {}

    function strlen(string memory str) internal pure returns (uint256) {
        uint256 len;
        uint256 i = 0;
        uint256 bytelength = bytes(str).length;
        for (len = 0; i < bytelength; len++) {
            bytes1 b = bytes(str)[i];
            if (b < 0x80) {
                i += 1;
            } else if (b < 0xE0) {
                i += 2;
            } else if (b < 0xF0) {
                i += 3;
            } else if (b < 0xF8) {
                i += 4;
            } else if (b < 0xFC) {
                i += 5;
            } else {
                i += 6;
            }
        }
        return len;
    }
}
