import 'reflect-metadata';
import { Node } from './node';
import type { HookKeys, IClazz } from './types';

const NAMESPACE_MAIN = 'metadata.hook.main.namespace';
const NAMESPACE_CONTAINER = 'metadata.hook.container.namespace';
const SYMBOLS_MAIN = Symbol('main');
const SYMBOLS_FLOWS = Symbol('flows');

export abstract class Hook<I, O> {
  public abstract res: O;
  private readonly [SYMBOLS_MAIN]: keyof this;
  private readonly [SYMBOLS_FLOWS] = new Map<keyof this, Node<this>>();

  constructor(public readonly req: I) {
    const ctor = Object.getPrototypeOf(this).constructor;
    if (Reflect.hasMetadata(NAMESPACE_MAIN, ctor)) {
      this[SYMBOLS_MAIN] = Reflect.getMetadata(NAMESPACE_MAIN, ctor);
    }
    if (Reflect.hasMetadata(NAMESPACE_CONTAINER, ctor)) {
      const hooks: Set<(obj: this) => void> = Reflect.getMetadata(NAMESPACE_CONTAINER, ctor);
      hooks.forEach(hook => hook(this));
    }
  }

  static use<T extends Hook<any, any>>(clazz: IClazz<T>, callback: (obj: T) => void) {
    if (!Reflect.hasMetadata(NAMESPACE_CONTAINER, clazz)) {
      Reflect.defineMetadata(NAMESPACE_CONTAINER, new Set<(obj: T) => void>(), clazz);
    }
    const hooks: Set<(obj: T) => void> = Reflect.getMetadata(NAMESPACE_CONTAINER, clazz);
    hooks.add(callback);
    return () => hooks.delete(callback);
  }

  /**
   * 入口注解
   * @param obj 
   * @param key 
   * @param descriptor 
   */
  static readonly Entry: MethodDecorator = (obj, key) => {
    Hook.setEntry(obj.constructor, key);
  }

  /**
   * 设置入口
   * @param ctor 
   * @param key 
   */
  static setEntry(ctor: Function, key: string | symbol) {
    if (!Reflect.hasMetadata(NAMESPACE_MAIN, ctor)) {
      Reflect.defineMetadata(NAMESPACE_MAIN, key, ctor);
    }
    const mainKey = Reflect.getMetadata(NAMESPACE_MAIN, ctor);
    if (key !== mainKey) {
      throw new Error(`Duplicate entry name: ${key.toString()} ${mainKey.toString()}`);
    }
  }

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
      // @ts-ignore
      if (fn[Symbol.toStringTag] !== 'AsyncFunction') {
        throw new Error('It must be an AsyncFunction on Key of ' + key.toString());
      }
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
    // Hook名必须存在
    if (!this[key]) {
      throw new Error('Non-existent hook name: ' + key.toString());
    }

    // 该Hook必须是一个函数
    if (typeof this[key] !== 'function') {
      throw new Error('The hook is not a valid function: ' + key.toString());
    }

    if (!this[SYMBOLS_FLOWS].has(key)) {
      this[SYMBOLS_FLOWS].set(key, new Node());
    }

    return this[SYMBOLS_FLOWS].get(key);
  }

  public async $execute() {
    if (this[SYMBOLS_MAIN]) {
      //@ts-ignore
      await this[this[SYMBOLS_MAIN]]();
    }
    return this.res;
  }
}