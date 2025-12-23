// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src_contract/LuminaFuel.sol";

contract LuminaFuelTest is Test {
    LuminaFuel public fuel;
    address public user = address(0x1);
    address public admin = address(this);

    function setUp() public {
        fuel = new LuminaFuel();
    }

    function testDeposit() public {
        vm.deal(user, 1 ether);
        vm.prank(user);
        fuel.deposit{value: 0.1 ether}();
        assertEq(fuel.getBalance(user), 0.1 ether);
    }

    function testDebit() public {
        vm.deal(user, 1 ether);
        vm.prank(user);
        fuel.deposit{value: 0.1 ether}();

        fuel.debit(user, 0.001 ether);
        assertEq(fuel.getBalance(user), 0.099 ether);
    }

    function testDebitInsufficient() public {
        vm.deal(user, 1 ether);
        vm.prank(user);
        fuel.deposit{value: 0.0005 ether}();

        vm.expectRevert("Insufficient fuel balance");
        fuel.debit(user, 0.001 ether);
    }
}
