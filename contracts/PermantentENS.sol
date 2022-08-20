// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./IENS.sol";
import "./IAlchemist.sol";
import "./IPermantentENS.sol";
import "./IUniswap.sol";

contract PermantentENS is IPermantentENS, Ownable {
    ETHRegistrarController constant ens_controller =
        ETHRegistrarController(0x283Af0B28c62C092C9727F1Ee09c02CA627EB7F5);
    ENSRegistrar constant ens_registrar =
        ENSRegistrar(0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85);
    UniswapV2Pair constant alUSD_WETH_pair =
        UniswapV2Pair(0x0589e281D35ee1Acf6D4fd32f1fbA60EFfb5281B);
    Alchemist constant alchemist =
        Alchemist(0x5C6374a2ac4EBC38DeA0Fc1F8716e5Ea1AdD94dd);
    IWETH constant weth = IWETH(0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2);

    /// @notice The fee when an user trigger renew for other one, divided by 100000
    uint256 public constant miner_fee = 10000;

    /// @inheritdoc IPermantentENS
    mapping(bytes32 => Config[]) public configs;

    /// @inheritdoc IPermantentENS
    function enable(string calldata name, uint256 max_duration) external {
        bytes32 label = keccak256(abi.encodePacked(name));
        Config memory config = Config({
            name: name,
            payer: msg.sender,
            max_duration: max_duration,
            disabled: false
        });
        emit NewConfig(label, configs[label].length);
        configs[label].push(config);
    }

    /// @inheritdoc IPermantentENS
    function disable(bytes32 label, uint256 config_idx) external {
        Config memory config = configs[label][config_idx];
        require(
            msg.sender == config.payer ||
                msg.sender == ens_registrar.ownerOf(uint256(label)),
            "Not allowed"
        );
        configs[label][config_idx].disabled = true;
        emit DisableConfig(label, config_idx);
    }

    /// @inheritdoc IPermantentENS
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
        uint256 price = ens_controller.rentPrice(config.name, duration); // in wei
        uint256 price_with_fee = (price * miner_fee) / 100000;
        uint256 required_alUSD = getALUSDAmount(price_with_fee);
        alchemist.mintFrom(config.payer, required_alUSD, address(this));

        // swap alUSD to ETH
        alUSD_WETH_pair.swap(required_alUSD, price_with_fee, address(this), "");
        weth.withdraw(price_with_fee);

        // renew ens
        ens_controller.renew{value: price}(config.name, duration);
        emit RenewedConfig(label, duration, new_expiry);

        // pay miner fee
        payable(msg.sender).call{value: price_with_fee - price}("");
    }

    /// @dev compute alUSD need for eth, it's identical with UniswapV2
    function getALUSDAmount(uint256 eth) internal view returns (uint256) {
        (uint256 alUSDAmount, uint256 ethAmount, ) = alUSD_WETH_pair
            .getReserves();
        uint256 numerator = alUSDAmount * eth * 1000;
        uint256 denominator = (ethAmount - eth) * 997;
        return numerator / denominator + 1;
    }
}
