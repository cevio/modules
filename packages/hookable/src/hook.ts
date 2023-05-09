import 'reflect-metadata';
import { Node } from './node';
import type { HookKeys } from './types';

const SYMBOLS_FLOWS = Symbol('flows');

export abstract class Hook<I, O, P extends any[] = []> {
  public abstract res: O;
  public abstract initialize(...args: P): Promise<unknown>;
  private readonly [SYMBOLS_FLOWS] = new Map<keyof this, Node<this>>();

  constructor(public readonly req: I) {}

  /**
   * 分支注解
   * @param obj 
   * @param key 
   * @param descriptor 
   */
  static readonly Node: MethodDecorator = (obj, key, descriptor) => {
    const fn = descriptor.value;
    type IFN = typeof fn;
    if (typeof fn === 'function') {
      descriptor.value = async function(this: Hook<any, any>, ...args: any[]) {
        const node = this[SYMBOLS_FLOWS].has(key as any) 
          ? this[SYMBOLS_FLOWS].get(key as any)
          : undefined;
        if (node) await node.executeInPrefix(this);
        const result = await Promise.resolve(fn.call(this, ...args));
        if (node) await node.executeInSuffix(this);
        return result;
      } as IFN
    }
  }

  public $hook(key: HookKeys<this>) {
    const fn = this[key] as Function;
    
    // Hook名必须存在
    if (!this[key]) {
      throw new Error('Non-existent hook name: ' + key.toString());
    }

    // 该Hook必须是一个函数
    if (typeof this[key] !== 'function') {
      throw new Error('The hook is not a valid function: ' + key.toString());
    }

    // 被hook的方法参数
    // 必须小于等于1
    if (fn.length > 1) {
      throw new Error('The hook function parameter must be less than or equal to 1: ' + key.toString());
    }

    if (!this[SYMBOLS_FLOWS].has(key)) {
      this[SYMBOLS_FLOWS].set(key, new Node());
    }

    return this[SYMBOLS_FLOWS].get(key);
  }

  public async $execute(...args: P) {
    await this.initialize(...args);
    return this.res;
  }
}