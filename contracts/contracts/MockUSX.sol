// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MockUSX is ERC20, Ownable {
    uint8 private _decimals;

    constructor(uint8 decimals_) ERC20("Mock USX", "mUSX") {
        _decimals = decimals_;
        _mint(msg.sender, 1000000 * 10 ** decimals_);
    }

    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    function burn(address from, uint256 amount) public onlyOwner {
        _burn(from, amount);
    }

    function faucet(address to, uint256 amount) public {
        require(amount <= 1000 * 10 ** _decimals, "Faucet limit exceeded");
        _mint(to, amount);
    }
}
