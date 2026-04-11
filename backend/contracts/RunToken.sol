// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title RunToken
 * @dev Soulbound token for the Runity Dapp. 
 * Max balance per user is 10,000 RUN.
 * Tokens can be transferred to/from the core smart contract (Escrow).
 */
contract RunToken is ERC20, Ownable {
    uint256 public constant MAX_BALANCE = 10000 * 10 ** 18;

    // App core contract that has permission to mint, burn, and escrow
    address public coreContract;
    
    event CoreContractUpdated(address indexed newCoreContract);

    constructor() ERC20("RunToken", "RUN") Ownable(msg.sender) {}

    modifier onlyCoreOrOwner() {
        require(msg.sender == coreContract || msg.sender == owner(), "RunToken: caller is not core or owner");
        _;
    }

    /**
     * @dev Sets the RunCore contract address
     */
    function setCoreContract(address _core) external onlyOwner {
        coreContract = _core;
        emit CoreContractUpdated(_core);
    }

    /**
     * @dev Mint tokens, bounded by MAX_BALANCE.
     */
    function mint(address to, uint256 amount) external onlyCoreOrOwner {
        require(balanceOf(to) + amount <= MAX_BALANCE, "RunToken: Max balance exceeded");
        _mint(to, amount);
    }

    /**
     * @dev Burn tokens from a specific address. Callable by the core contract
     */
    function burn(address from, uint256 amount) external onlyCoreOrOwner {
        _burn(from, amount);
    }

    /**
     * @dev Soulbound implementation for OpenZeppelin v5.
     * Reverts if neither the sender nor the recipient is the core contract or zero address.
     */
    function _update(address from, address to, uint256 value) internal override {
        if (
            from != address(0) && 
            to != address(0) && 
            from != coreContract && 
            to != coreContract
        ) {
            revert("RunToken: Tokens are Soulbound and non-transferable p2p");
        }
        super._update(from, to, value);
    }
}
