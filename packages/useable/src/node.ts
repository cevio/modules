export class Node extends Map<string, Set<Function>> {
  public on(key: string, callback: Function) {
    if (!this.has(key)) {
      this.set(key, new Set());
    }
    this.get(key).add(callback);
    return this;
  }

  public off(key: string, callback?: Function) {
    if (this.has(key)) {
      if (!callback) {
        this.delete(key);
      } else {
        const stacks = this.get(key);
        if (stacks.has(callback)) {
          stacks.delete(callback);
          if (!stacks.size) {
            this.delete(key);
          }
        }
      }
    }
    return this;
  }

  public async use<R>(key: string, res: R): Promise<void> {
    if (this.has(key)) {
      await Promise.all(
        Array.from(this.get(key).values())
          .map(fun => Promise.resolve(fun(res)))
      )
    }
  }
}