"use client";

import { useEffect, useRef } from "react";
import { useAccount } from "wagmi";
import { useRouter, usePathname } from "next/navigation";
import { getPlansByOwner } from "@/lib/indexer";

export function ConnectRouter() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const pathname = usePathname();
  const didRoute = useRef(false);

  useEffect(() => {
    // Only redirect from /dashboard (the default landing page after connect)
    // and only once per connection session
    if (!isConnected || !address || pathname !== "/dashboard" || didRoute.current) return;

    didRoute.current = true;

    (async () => {
      const plans = await getPlansByOwner(address);
      const isMerchant = plans.length > 0;

      if (isMerchant) return;          // stay on /dashboard
      router.replace("/plans");        // new user — onboard as merchant
    })();
  }, [isConnected, address, pathname, router]);

  // Reset on disconnect so reconnecting a different wallet re-routes
  useEffect(() => {
    if (!isConnected) didRoute.current = false;
  }, [isConnected]);

  return null;
}
