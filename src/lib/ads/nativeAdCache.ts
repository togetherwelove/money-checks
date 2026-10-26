type DisposableAd = { destroy: () => void };
type Entry<T> = {
  promise: Promise<T | null>;
  ad: T | null;
  users: number;
  expiresAt: number;
  timer?: ReturnType<typeof setTimeout>;
};

// Cache idle ads rather than tying their lifetime to virtualized list cells.
export class NativeAdCache<T extends DisposableAd> {
  private entries = new Map<number, Entry<T>>();

  constructor(
    private load: (slot: number) => Promise<T | null>,
    private maxIdle: number,
    private lifetimeMs: number,
    private retryMs: number,
  ) {}

  acquire(slot: number) {
    let entry = this.entries.get(slot);
    if (entry && !entry.users && entry.expiresAt <= Date.now()) {
      this.remove(slot, entry);
      entry = undefined;
    }
    if (!entry) {
      const created: Entry<T> = { promise: Promise.resolve(null), ad: null, users: 0, expiresAt: Infinity };
      entry = created;
      this.entries.set(slot, created);
      created.promise = Promise.resolve().then(() => this.load(slot)).catch(() => null).then((ad) => {
        if (this.entries.get(slot) !== created) {
          ad?.destroy();
          return null;
        }
        created.ad = ad;
        created.expiresAt = Date.now() + (ad ? this.lifetimeMs : this.retryMs);
        if (!created.users) this.scheduleExpiry(slot, created);
        return ad;
      });
    }
    clearTimeout(entry.timer);
    entry.users++;
    // Map insertion order is the least-recently-used order.
    this.entries.delete(slot);
    this.entries.set(slot, entry);
    const lease = entry;
    let released = false;
    return {
      promise: lease.promise,
      release: () => {
        if (released || this.entries.get(slot) !== lease) return;
        released = true;
        lease.users--;
        if (!lease.users) this.scheduleExpiry(slot, lease);
        this.trimIdle();
      },
    };
  }

  dispose() {
    for (const [slot, entry] of this.entries) this.remove(slot, entry);
  }

  private scheduleExpiry(slot: number, entry: Entry<T>) {
    clearTimeout(entry.timer);
    if (!Number.isFinite(entry.expiresAt)) return;
    entry.timer = setTimeout(() => {
      if (!entry.users && this.entries.get(slot) === entry) this.remove(slot, entry);
    }, Math.max(0, entry.expiresAt - Date.now()));
  }

  private trimIdle() {
    const idle = [...this.entries].filter(([, entry]) => !entry.users);
    for (const [slot, entry] of idle.slice(0, Math.max(0, idle.length - this.maxIdle))) {
      this.remove(slot, entry);
    }
  }

  private remove(slot: number, entry: Entry<T>) {
    this.entries.delete(slot);
    clearTimeout(entry.timer);
    entry.ad?.destroy();
  }
}
