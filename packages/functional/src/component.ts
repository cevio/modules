import { Hook } from './hook';
import type { 
  Component, 
  ComponentChildren, 
  ComponentWrapper,
  ComponentRender,
  PureCompoenntProps,
} from './types';

/**
 * create a new component render
 * run it with hook
 * it will return a value finnally
 * @param callback running function component
 * @param props function component props
 * @param args children function component
 * @returns 
 */
export function createComponent<T extends Component>(
  callback: T, 
  props?: PureCompoenntProps<T>, 
  ...childrens: ComponentWrapper<ComponentChildren<T>>
): ComponentRender<T> {
  return async (hook?: Hook) => {
    // define useHook function
    // inject into props
    // it collect fns from hook provider
    // then run the each hooks at the end of fn result
    const useHook = async <R>(key: string, fn: () => R) => {
      const res = await Promise.resolve(fn());
      if (hook && hook.has(callback)) {
        await hook.use(callback).use(key, res);
      }
      return res;
    }

    // run the children state
    // before callback
    const children = await Promise.all(childrens.map(child => {
      // support common values
      if (typeof child !== 'function') return Promise.resolve(child);
      // support component render
      return Promise.resolve(child(hook));
    }));

    // run the callback fn
    const res = await Promise.resolve(
      callback(
        // freeze the object
        // make it unresetable
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

    // if return a function
    // that means it is a component
    // so we should run the component with hook
    if (typeof res === 'function') {
      return await Promise.resolve(res(hook));
    }
    
    return res;
  }
}