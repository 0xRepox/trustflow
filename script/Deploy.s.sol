// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {PlanRegistry} from "../src/PlanRegistry.sol";
import {StreamManager} from "../src/StreamManager.sol";

contract Deploy is Script {
    address constant PERMIT2 = 0x000000000022D473030F116dDEE9F6B43aC78BA3;

    function run() external {
        address usdc = vm.envAddress("USDC_ARC_TESTNET");
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerKey);

        PlanRegistry registry = new PlanRegistry();
        StreamManager manager = new StreamManager(usdc, address(registry), PERMIT2);

        vm.stopBroadcast();

        console.log("PlanRegistry:", address(registry));
        console.log("StreamManager:", address(manager));
        console.log("USDC:", usdc);
        console.log("Chain ID:", block.chainid);

        _writeDeployments(address(registry), address(manager), usdc);
    }

    function _writeDeployments(address registry, address manager, address usdc) internal {
        string memory json = string(
            abi.encodePacked(
                '{"chainId":',
                vm.toString(block.chainid),
                ',"contracts":{"PlanRegistry":"',
                vm.toString(registry),
                '","StreamManager":"',
                vm.toString(manager),
                '"},"usdc":"',
                vm.toString(usdc),
                '","permit2":"0x000000000022D473030F116dDEE9F6B43aC78BA3"}'
            )
        );
        vm.writeFile("deployments/arc-testnet.json", json);
        console.log("Deployment info written to deployments/arc-testnet.json");
    }
}
