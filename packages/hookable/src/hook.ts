import 'reflect-metadata';
import { Node } from './node';
import type { Next } from './types';

const NAMESPACE_MAIN = 'metadata.hook.main.namespace';
const SYMBOLS_MAIN = Symbol('main');
const SYMBOLS_FLOWS = Symbol('flows');
const SYMBOLS_RUN = Symbol('run');

export abstract class Hook<I, O> {
  public abstract res: O;
  private readonly [SYMBOLS_MAIN]: keyof this;
  private readonly [SYMBOLS_FLOWS] = new Map<keyof this, Node<this>>();

  constructor(public readonly req: I) {
    const ctor = Object.getPrototypeOf(this).constructor;
    if (Reflect.hasMetadata(NAMESPACE_MAIN, ctor)) {
      this[SYMBOLS_MAIN] = Reflect.getMetadata(NAMESPACE_MAIN, ctor);
    }
  }

  static readonly Entry: MethodDecorator = (obj, key) => {
    const ctor = obj.constructor;
    if (!Reflect.hasMetadata(NAMESPACE_MAIN, ctor)) {
      Reflect.defineMetadata(NAMESPACE_MAIN, key, ctor);
    }
    const mainKey = Reflect.getMetadata(NAMESPACE_MAIN, ctor);
    if (key !== mainKey) {
      throw new Error(`Duplicate entry name: ${key.toString()} ${mainKey.toString()}`);
    }
  }

  private async [SYMBOLS_RUN](key: keyof this) {
    if (!!this[key] && typeof this[key] === 'function') {
      const node = this[SYMBOLS_FLOWS].get(key);
      const next: Next<this> = async n => {
        if (node) {
          await node.executeInSuffix(this);
        }
        if (n) {
          await this[SYMBOLS_RUN](n);
        }
      }
      if (node) {
        await node.executeInPrefix(this);
      }

      // @ts-ignore
      await Promise.resolve(this[key](next));
    }
  }

  public hook(key: keyof this) {
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

  public async execute() {
    if (this[SYMBOLS_MAIN]) {
      const key = this[SYMBOLS_MAIN];
      await this[SYMBOLS_RUN](key);
    }
    return this.res;
  }
}