// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {PlanRegistry} from "../src/PlanRegistry.sol";

contract SeedPlans is Script {
    // Precomputed: price_usd * 1_000_000 / 2_592_000 (30-day month, 6-decimal USDC)
    uint128 constant BASIC_RATE = 1;   // $5/mo  → 5_000_000 / 2_592_000 ≈ 1 wei/sec
    uint128 constant PRO_RATE = 11;    // $29/mo → 29_000_000 / 2_592_000 ≈ 11 wei/sec
    uint128 constant ENTERPRISE_RATE = 38; // $99/mo → 99_000_000 / 2_592_000 ≈ 38 wei/sec

    uint32 constant GRACE_PERIOD = 86400; // 1 day

    function run() external {
        address registryAddr = vm.envAddress("PLAN_REGISTRY");
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");

        PlanRegistry registry = PlanRegistry(registryAddr);

        vm.startBroadcast(deployerKey);

        uint256 basicId = registry.createPlan(BASIC_RATE, GRACE_PERIOD, 0);
        uint256 proId = registry.createPlan(PRO_RATE, GRACE_PERIOD, 1);
        uint256 enterpriseId = registry.createPlan(ENTERPRISE_RATE, GRACE_PERIOD * 3, 2);

        vm.stopBroadcast();

        console.log("Basic plan ($5/mo)       id:", basicId, "rate:", BASIC_RATE);
        console.log("Pro plan ($29/mo)        id:", proId, "rate:", PRO_RATE);
        console.log("Enterprise plan ($99/mo) id:", enterpriseId, "rate:", ENTERPRISE_RATE);
    }
}
