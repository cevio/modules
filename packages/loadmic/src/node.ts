export class Node extends Set<{
  resolve: (v: any) => unknown,
  reject: (e: any) => unknown,
}> {
  private status: 0 | 1 | -1 = 0;
  private error: any;
  private value: any;

  public resolve(v: any) {
    this.status = 1;
    this.value = v;
    this.error = undefined;
    return this;
  }

  public reject(e: any) {
    this.status = -1;
    this.error = e;
    this.value = undefined;
    return this;
  }

  public nofity() {
    for (const { resolve, reject } of this.values()) {
      switch (this.status) {
        case 1: resolve(this.value); break;
        case -1: reject(this.error); break;
      }
    }
    this.clear();
  }

  public wait(resolve: (v: any) => unknown, reject: (e: any) => unknown) {
    switch (this.status) {
      case 1: resolve(this.value); break;
      case -1: reject(this.error); break;
      case 0: this.add({ resolve, reject }); break;
    }
    return this;
  }

  public get() {
    switch (this.status) {
      case -1: throw this.error;
      case 0: throw new Error('Component is pending.');
      case 1: return this.value;
      default: throw new Error('Unknow status.');
    }
  }
}