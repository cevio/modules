import { Hook } from './hook';
import type { 
  Component, 
  ComponentChildren, 
  ComponentResult, 
  ComponentWrapper,
  PureCompoenntProps,
} from './types';

export function createComponent<T extends Component>(
  callback: T, 
  props?: PureCompoenntProps<T>, 
  ...args: ComponentWrapper<ComponentChildren<T>>
) {
  return async (hook?: Hook): Promise<ComponentResult<T> extends Promise<infer H> ? H : ComponentResult<T>> => {
    const useHook = async <R>(key: string, fn: () => R) => {
      const res = await Promise.resolve(fn());
      if (hook && hook.has(callback)) {
        await hook.use(callback).use(key, res);
      }
      return res;
    }

    const children = await Promise.all(args.map(child => {
      if (typeof child !== 'function') return Promise.resolve(child);
      return Promise.resolve(child(hook));
    }));

    const res = await Promise.resolve(
      callback(
        Object.freeze(
          Object.assign(
            props || {}, 
            { 
              children, 
              useHook 
            }
          )
        )
      )
    );
    
    return res;
  }
}