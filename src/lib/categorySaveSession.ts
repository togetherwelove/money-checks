// Reads must not overwrite a newer write; whole-list writes must run in order.
export class CategorySaveSession {
  revision = 0;
  pending = 0;
  ready = false;
  active = true;
  private tail: Promise<unknown> = Promise.resolve();

  async write<T>(operation: () => Promise<T>): Promise<T> {
    this.revision++;
    this.pending++;
    const result = this.tail.then(operation);
    this.tail = result.catch(() => undefined);
    try {
      return await result;
    } finally {
      this.pending--;
    }
  }

  canApplyRead(revision: number): boolean {
    return this.active && this.pending === 0 && this.revision === revision;
  }
}
