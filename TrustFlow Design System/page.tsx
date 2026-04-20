"use client";

import { useAccount } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { getPlansByOwner, getStreamsByPlanIds, getDisputesByMerchant } from "@/lib/envio";
import Link from "next/link";

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
      <p className="text-sm text-gray-400">{label}</p>
      <p className="text-3xl font-semibold mt-1">{value}</p>
    </div>
  );
}

export default function OverviewPage() {
  const { address, isConnected } = useAccount();

  const { data: plans } = useQuery({
    queryKey: ["plans", address],
    queryFn: () => getPlansByOwner(address!),
    enabled: !!address,
  });

  const { data: streams } = useQuery({
    queryKey: ["streams", plans?.map((p) => p.id)],
    queryFn: () => getStreamsByPlanIds(plans!.map((p) => p.id)),
    enabled: !!plans?.length,
  });

  const { data: disputes } = useQuery({
    queryKey: ["disputes", streams?.map((s) => s.id)],
    queryFn: () => getDisputesByMerchant(streams!.map((s) => s.id)),
    enabled: !!streams?.length,
  });

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4 text-center">
        <h1 className="text-2xl font-semibold">TrustFlow Merchant Dashboard</h1>
        <p className="text-gray-400">Connect your wallet to view your subscription revenue.</p>
      </div>
    );
  }

  const activeStreams = streams?.filter((s) => s.status === "Active") ?? [];
  const openDisputes = disputes?.filter((d) => d.status === "Open") ?? [];
  const totalEarned = streams?.reduce((acc, s) => acc + BigInt(s.claimed), 0n) ?? 0n;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Overview</h1>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total Earned (USDC)" value={(Number(totalEarned) / 1e6).toFixed(2)} />
        <StatCard label="Active Streams" value={activeStreams.length} />
        <StatCard label="Open Disputes" value={openDisputes.length} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/plans" className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-blue-600 transition-colors">
          <p className="font-medium">Manage Plans</p>
          <p className="text-sm text-gray-400 mt-1">{plans?.length ?? 0} plans created</p>
        </Link>
        <Link href="/streams" className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-blue-600 transition-colors">
          <p className="font-medium">View Streams</p>
          <p className="text-sm text-gray-400 mt-1">{streams?.length ?? 0} total streams</p>
        </Link>
        <Link href="/disputes" className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-blue-600 transition-colors">
          <p className="font-medium">Dispute Inbox</p>
          <p className="text-sm text-gray-400 mt-1">{openDisputes.length} open disputes</p>
        </Link>
      </div>
    </div>
  );
}
