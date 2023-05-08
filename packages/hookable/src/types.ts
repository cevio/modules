import type { Hook } from './hook';

export type NextKeys<T> = {
  [K in keyof T]: K extends 'hook'
    ? never 
    : T[K] extends (next?: Next<T>) => Promise<void> 
      ? K 
      : never
}[keyof T];

export type PickHook<T> = T extends Hook<infer I, infer O> ? [I, O] : [never, never];
export type Next<T> = (key?: NextKeys<T>) => Promise<unknown>;
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

