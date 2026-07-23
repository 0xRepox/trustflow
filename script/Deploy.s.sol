// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {PlanRegistry} from "../src/PlanRegistry.sol";
import {StreamManager} from "../src/StreamManager.sol";
import {DisputeResolver} from "../src/DisputeResolver.sol";

/// Deploys the full system and wires it together.
///
/// StreamManager gates freezeForDispute/resolveDispute behind
/// `onlyDisputeResolver`, so a deploy that skips setDisputeResolver leaves the
/// entire dispute layer unreachable. This script asserts the wiring landed
/// rather than trusting that the transaction went through.
contract Deploy is Script {
    address constant PERMIT2 = 0x000000000022D473030F116dDEE9F6B43aC78BA3;

    function run() external {
        address usdc = vm.envAddress("USDC_ARC_TESTNET");
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerKey);

        PlanRegistry registry = new PlanRegistry();
        StreamManager manager = new StreamManager(usdc, address(registry), PERMIT2);
        DisputeResolver resolver = new DisputeResolver(address(manager), usdc);

        manager.setDisputeResolver(address(resolver));

        vm.stopBroadcast();

        // Fail loudly here rather than discovering it when a dispute reverts.
        require(manager.disputeResolver() == address(resolver), "dispute resolver not wired");
        require(address(resolver.streamManager()) == address(manager), "resolver points at wrong manager");
        require(resolver.arbitrator() == vm.addr(deployerKey), "unexpected arbitrator");

        console.log("PlanRegistry:   ", address(registry));
        console.log("StreamManager:  ", address(manager));
        console.log("DisputeResolver:", address(resolver));
        console.log("USDC:           ", usdc);
        console.log("Arbitrator:     ", resolver.arbitrator());
        console.log("Chain ID:       ", block.chainid);

        _writeDeployments(address(registry), address(manager), address(resolver), usdc);
    }

    function _writeDeployments(address registry, address manager, address resolver, address usdc) internal {
        string memory json = string(
            abi.encodePacked(
                '{"chainId":',
                vm.toString(block.chainid),
                ',"contracts":{"PlanRegistry":"',
                vm.toString(registry),
                '","StreamManager":"',
                vm.toString(manager),
                '","DisputeResolver":"',
                vm.toString(resolver),
                '"},"usdc":"',
                vm.toString(usdc),
                '","permit2":"0x000000000022D473030F116dDEE9F6B43aC78BA3","deployedAt":',
                vm.toString(block.timestamp),
                "}"
            )
        );
        vm.writeFile("deployments/arc-testnet.json", json);
        console.log("Wrote deployments/arc-testnet.json");
    }
}
