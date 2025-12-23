// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src_contract/LuminaFuel.sol";

contract DeployLuminaFuel is Script {
    function run() external {
        vm.startBroadcast();

        LuminaFuel fuel = new LuminaFuel();

        vm.stopBroadcast();
        
        console.log("LuminaFuel deployed to:", address(fuel));
    }
}
