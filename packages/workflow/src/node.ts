import { Pipeline } from './pipeline';

export type INodeFunction<T extends Pipeline = Pipeline> = (obj: T) => void | Promise<void>;

interface INodeProps {
  fn: INodeFunction,
  before?: string,
  after?: string,
}

interface INodeSortProps extends INodeProps {
  index: number,
}

export class Node<T extends Pipeline = Pipeline> {
  public readonly prefix = new Map<string, INodeProps>();
  public readonly suffix = new Map<string, INodeProps>();

  public async executeInPrefix(obj: T) {
    const fns = this.sort('prefix');
    for (let i = 0; i < fns.length; i++) {
      await Promise.resolve(fns[i](obj));
    }
  }

  public async executeInSuffix(obj: T) {
    const fns = this.sort('suffix');
    for (let i = 0; i < fns.length; i++) {
      await Promise.resolve(fns[i](obj));
    }
  }

  public before(name: string, callback: INodeFunction<T>) {
    if (this.prefix.has(name) || this.suffix.has(name)) {
      throw new Error(`Node childname [${name}] has already exists.`);
    }
    this.prefix.set(name, { fn: callback });
    return this;
  }

  public after(name: string, callback: INodeFunction<T>) {
    if (this.prefix.has(name) || this.suffix.has(name)) {
      throw new Error(`Node childname [${name}] has already exists.`);
    }
    this.suffix.set(name, { fn: callback });
    return this;
  }

  public insertBefore(name: string, hookname: string, callback: INodeFunction<T>) {
    if (this.prefix.has(hookname)) {
      this.prefix.set(name, {
        before: hookname,
        fn: callback,
      })
    } else if (this.suffix.has(hookname)) {
      this.suffix.set(name, {
        before: hookname,
        fn: callback,
      })
    } else {
      throw new Error(`Hookname [${hookname}] is not exists`);
    }
    return this;
  }

  public insertAfter(name: string, hookname: string, callback: INodeFunction<T>) {
    if (this.prefix.has(hookname)) {
      this.prefix.set(name, {
        after: hookname,
        fn: callback,
      })
    } else if (this.suffix.has(hookname)) {
      this.suffix.set(name, {
        after: hookname,
        fn: callback,
      })
    } else {
      throw new Error(`Hookname [${hookname}] is not exists`);
    }
    return this;
  }

  private sort(type: 'prefix' | 'suffix') {
    const map = type === 'prefix' ? this.prefix : this.suffix;
    const temp = new Map<string, INodeSortProps>();

    for (const [name, { before, after, fn }] of map.entries()) {
      temp.set(name, {
        before, after, fn,
        get index() {
          if (!this.before && !this.after) return 0;
          if (this.before) {
            if (!temp.has(this.before)) {
              throw new Error('Cannot find ' + this.before);
            }
            return temp.get(this.before).index - 1;
          } 
          if (this.after) {
            if (!temp.has(this.after)) {
              throw new Error('Cannot find ' + this.after);
            }
            return temp.get(this.after).index + 1;
          }
          return 0;
        }
      });
    }

    return Array.from(temp.values())
      .sort((prev, next) => prev.index - next.index)
      .map(node => node.fn);
  }

  public delete(name: string) {
    if (this.prefix.has(name)) {
      this.prefix.delete(name);
    } else if (this.suffix.has(name)) {
      this.suffix.delete(name);
    }
  }
}