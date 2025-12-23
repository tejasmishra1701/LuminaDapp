// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract LuminaFuel {
    address public owner;
    mapping(address => uint256) public balances;

    event Deposited(address indexed user, uint256 amount);
    event Debited(address indexed user, uint256 amount);

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "LuminaFuel: caller is not the owner");
        _;
    }

    function deposit() public payable {
        require(msg.value > 0, "LuminaFuel: deposit amount must be greater than zero");
        balances[msg.sender] += msg.value;
        emit Deposited(msg.sender, msg.value);
    }

    function debit(address user, uint256 amount) public onlyOwner {
        require(balances[user] >= amount, "LuminaFuel: insufficient fuel balance");
        balances[user] -= amount;
        emit Debited(user, amount);
    }

    function getBalance(address user) public view returns (uint256) {
        return balances[user];
    }

    function withdraw() public onlyOwner {
        uint256 amount = address(this).balance;
        require(amount > 0, "LuminaFuel: nothing to withdraw");
        payable(owner).transfer(amount);
    }
}
