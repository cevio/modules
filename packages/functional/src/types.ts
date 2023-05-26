import type { Hook } from './hook';
export type Props<I, C extends Array<any> = []> = Readonly<I & { 
  children?: C,
  useHook?: <R>(key: string, fn: () => R | Promise<R>) => Promise<R> 
}>;

export type Component<I = {}, C extends Array<any> = any[], O = any> = (props?: Props<I, C>) => O | Promise<O> | ((hook?: Hook) => Promise<O>);

export type ComponentChildren<T> = T extends (...args: any[]) => any ? Parameters<T>[0] extends { readonly children?: infer C } ? C : [] : [];

export type ComponentWrapper<T extends any[]> = [
  ...{ 
    [K in keyof T]: ((hook?: Hook) => Promise<T[K]>) | T[K]
  }
];

export type ComponentProps<T> = T extends Component<infer I, infer C, any> ? Props<I, C> : never;

export type PureCompoenntProps<T> = ComponentProps<T> extends Props<infer P, any> ? Omit<P, 'children' | 'useHook'> : never;

export type ComponentRender<T extends (...args: any[]) => any> = (hook?: Hook) => Promise<
  ReturnType<T> extends ComponentRender<infer N> 
    ? ReturnType<N> extends Promise<infer P>
      ? P
      : ReturnType<N>
    : ReturnType<T>
>;