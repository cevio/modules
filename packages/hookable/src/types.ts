import type { Hook } from './hook';

export type HookKeys<T> = {
  [K in keyof T]: K extends `$${string}`
    ? never 
    : T[K] extends Function
      ? K 
      : never
}[keyof T];

export type PickHook<T> = T extends Hook<infer I, infer O, infer P> ? [I, O, P] : [never, never, []];
export type INodeFunction<T> = (obj: T) => unknown | Promise<unknown>;

export interface IClazz<T> {
  new (req: PickHook<T>[0], res?: PickHook<T>[1]): T;
}

export interface INodeProps<T> {
  fn: INodeFunction<T>,
  before?: string,
  after?: string,
}

export interface INodeSortProps<T> extends INodeProps<T> {
  index: number,
}

