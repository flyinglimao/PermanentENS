// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IPermantentENS {
    /// @notice Emit when a new config is added
    event NewConfig(bytes32 indexed label, uint config_idx);

    /// @notice Emit when a config is disavled
    event DisableConfig(bytes32 indexed label, uint config_idx);

    /// @notice Emit when a config is renewed
    event RenewedConfig(bytes32 indexed label, uint duration, uint new_expiry);

    /// @notice Defines renew config
    struct Config {
        // Raw domain name (excluding `.eth`, such as `limao` instead of `limao.eth`)
        string name;
        address payer;
        // Miner can only extend the expire date to (today + max_duration)
        uint256 max_duration;
        bool disabled;
    }

    /// @dev The configs mapped by the label of a domain (keccak256(name)).
    function configs(bytes32 label, uint256 config_idx)
        external
        returns (
            string memory name,
            address payer,
            uint256 max_duration,
            bool disabled
        );

    /// @notice Append a config for a label, anyone can call it
    function enable(string calldata name, uint256 max_duration) external;

    /// @notice Disable a config. Only payer and domain owner can call it.
    ///
    /// @param label The label of target domain (keccak256(name))
    /// @param config_idx The config will be disabled
    function disable(bytes32 label, uint256 config_idx) external;

    /// @notice Trigger renew of a config
    ///
    /// @param label The label of target domain (keccak256(name))
    /// @param config_idx The config will be used
    /// @param duration The extend length
    function mine(
        bytes32 label,
        uint256 config_idx,
        uint256 duration
    ) external;
}