// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

interface Alchemist {
    function mintFrom(
        address owner,
        uint amount,
        address recipient
    ) external;
}

interface ETHRegistrarController {
    function renew(string calldata name, uint duration) external payable;

    function rentPrice(string memory name, uint duration)
        external
        view
        returns (uint);
}

interface ENSRegistrar {
    function nameExpires(uint id) external view returns (uint);

    function ownerOf(uint id) external view returns (address);
}

interface UniswapV2Pair {
    function getReserves()
        external
        view
        returns (
            uint112 _reserve0,
            uint112 _reserve1,
            uint32 _blockTimestampLast
        );

    function swap(
        uint amount0Out,
        uint amount1Out,
        address to,
        bytes calldata data
    ) external;
}

interface IWETH is IERC721 {
    function withdraw(uint wad) external;
}

contract PermantentENS is Ownable {
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
    uint public constant miner_fee = 10000;

    /// @notice Defines renew config
    struct Config {
        // Raw domain name (excluding `.eth`, such as `limao` instead of `limao.eth`)
        string name;
        address payer;
        // Miner can only extend the expire date to (today + max_duration)
        uint max_duration;
        bool disabled;
    }

    /// @dev The configs mapped by the label of a domain (keccak256(name)).
    mapping(bytes32 => Config[]) public configs;

    /// @notice Append a config for a label, anyone can call it
    function enable(Config calldata config) external {
        // not going to check mint allowance here since there isn't a p
        bytes32 label = keccak256(abi.encodePacked(config.name));
        configs[label].push(config);
    }

    /// @notice Disable a config. Only payer and domain owner can call it.
    ///
    /// @param label The label of target domain (keccak256(name))
    /// @param config_idx The config will be disabled
    function disable(bytes32 label, uint config_idx) external {
        Config memory config = configs[label][config_idx];
        require(
            msg.sender == config.payer ||
                msg.sender ==
                ens_registrar.ownerOf(
                    uint(keccak256(abi.encodePacked(config.name)))
                ),
            "Not allowed"
        );
        configs[label][config_idx].disabled = true;
    }

    /// @notice Trigger renew of a config
    ///
    /// @param label The label of target domain (keccak256(name))
    /// @param config_idx The config will be used
    /// @param duration The extend length
    function mine(
        bytes32 label,
        uint config_idx,
        uint duration
    ) external {
        Config memory config = configs[label][config_idx];
        require(!config.disabled, "Config disabled");
        // name expire + extend length < current + max_duration
        require(
            ens_registrar.nameExpires(
                uint(keccak256(abi.encodePacked(config.name)))
            ) +
                duration <=
                block.timestamp + config.max_duration,
            "Extend too long"
        );

        // compute the alUSD required to pay renew fee and miner fee
        uint price = ens_controller.rentPrice(config.name, duration); // in wei
        uint price_with_fee = price * miner_fee / 100000;
        uint required_alUSD = getALUSDAmount(price_with_fee);
        alchemist.mintFrom(config.payer, required_alUSD, address(this));

        // swap alUSD to ETH
        alUSD_WETH_pair.swap(required_alUSD, price_with_fee, address(this), "");
        weth.withdraw(price_with_fee);
        
        // renew ens
        ens_controller.renew{value: price}(config.name, duration);

        // pay miner fee
        payable(msg.sender).call{value: price_with_fee - price}("");
    }

    function getALUSDAmount(uint eth) internal view returns (uint) {
        (uint alUSDAmount, uint ethAmount, ) = alUSD_WETH_pair.getReserves();
        uint numerator = alUSDAmount * eth * 1000;
        uint denominator = (ethAmount - eth) * 997;
        return numerator / denominator + 1;
    }
}
