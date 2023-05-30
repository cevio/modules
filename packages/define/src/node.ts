export class Node extends Map<string | symbol, Set<Function>> {
  public on(key: string | symbol, fn: Function) {
    if (!this.has(key)) {
      this.set(key, new Set())
    }
    this.get(key).add(fn);
    return this;
  }

  public off(key: string | symbol, fn?: Function) {
    if (this.has(key)) {
      const stack = this.get(key);
      if (fn) {
        if (stack.has(fn)) {
          stack.delete(fn);
          if (!stack.size) {
            this.delete(key);
          }
        }
      } else {
        this.delete(key);
      }
    }
    return this;
  }
}