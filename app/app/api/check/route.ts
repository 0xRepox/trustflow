import { NextRequest, NextResponse } from "next/server";
import { getPlanById, getActiveStream } from "@/lib/indexer";

const USDC_DECIMALS = 1_000_000;

interface CheckResult {
  active: boolean;
  streamId: string | null;
  rate: string | null;
  consumed: string | null;
  remaining: string | null;
  canceledAt: number | null;
}

/**
 * Gates access on a live stream. Same shape whether the caller posts
 * form-encoded fields (curl -d) or JSON — this exists to be drop-in
 * copy-pasteable from the landing page's curl example.
 */
async function readParams(req: NextRequest): Promise<{ planId?: string; address?: string }> {
  const contentType = req.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const body = await req.json().catch(() => ({}));
    return { planId: body.planId, address: body.address };
  }
  const form = await req.formData().catch(() => null);
  if (form) {
    return {
      planId: form.get("planId")?.toString(),
      address: form.get("address")?.toString(),
    };
  }
  return {};
}

export async function POST(req: NextRequest): Promise<NextResponse<CheckResult | { error: string }>> {
  const { planId, address } = await readParams(req);

  if (!planId || !address) {
    return NextResponse.json({ error: "planId and address are required" }, { status: 400 });
  }

  const [plan, stream] = await Promise.all([
    getPlanById(planId),
    getActiveStream(planId, address),
  ]);

  if (!plan || !stream) {
    return NextResponse.json({
      active: false,
      streamId: null,
      rate: null,
      consumed: null,
      remaining: null,
      canceledAt: null,
    });
  }

  const rate = Number(plan.ratePerSecond);
  const deposited = Number(stream.deposited);
  const elapsed = Date.now() / 1000 - Number(stream.createdAt);
  const consumed = Math.min(rate * elapsed, deposited);
  const remaining = Math.max(0, deposited - consumed);

  return NextResponse.json({
    active: true,
    streamId: stream.id,
    rate: plan.ratePerSecond,
    consumed: Math.floor(consumed).toString(),
    remaining: Math.floor(remaining).toString(),
    canceledAt: stream.cancelledAt ?? null,
  });
}
