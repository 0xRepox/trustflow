/**
 * What the agent asks to decide whether the service it's paying for is still
 * behaving. Kept as an interface so a demo or test can inject a fake without
 * standing up a real endpoint — the dispute trigger is what's being proven,
 * not any particular health-check transport.
 */
export interface HealthCheck {
  check(): Promise<boolean>;
}

/** Considers the service healthy iff it answers with a 2xx within the timeout. */
export class HttpHealthCheck implements HealthCheck {
  constructor(
    private readonly url: string,
    private readonly timeoutMs = 5_000,
  ) {}

  async check(): Promise<boolean> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const res = await fetch(this.url, { signal: controller.signal });
      return res.ok;
    } catch {
      // Network error, timeout, or abort — all read as "not healthy."
      return false;
    } finally {
      clearTimeout(timer);
    }
  }
}

/** Always reports healthy — useful for wiring tests that shouldn't dispute. */
export class NoopHealthCheck implements HealthCheck {
  async check(): Promise<boolean> {
    return true;
  }
}
