import { NextRequest, NextResponse } from "next/server";
import { getActiveStream } from "@/lib/envio";

export async function GET(req: NextRequest) {
  const planId = req.nextUrl.searchParams.get("planId");
  const address = req.nextUrl.searchParams.get("address");

  if (!planId || !address) {
    return NextResponse.json(
      { error: "Missing required params: planId, address" },
      { status: 400 }
    );
  }

  if (!/^0x[0-9a-fA-F]{40}$/.test(address)) {
    return NextResponse.json({ error: "Invalid address format" }, { status: 400 });
  }

  const stream = await getActiveStream(planId, address);

  if (!stream) {
    return NextResponse.json({ active: false, stream: null });
  }

  const USDC_DECIMALS = 1_000_000;
  const deposited = Number(stream.deposited) / USDC_DECIMALS;
  const consumed = Number(stream.consumed) / USDC_DECIMALS;
  const remaining = deposited - consumed;

  return NextResponse.json({
    active: true,
    stream: {
      id: stream.id,
      planId: stream.planId,
      deposited,
      consumed,
      remaining,
      createdAt: stream.createdAt,
    },
  });
}
