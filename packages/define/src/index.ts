import type { DefineContext, DefineFeedback, DefineHandler } from './types';

export * from './hook';
export * from './node';
export * from './types';

export function define<I, O>(callback: DefineHandler<I, O>) {
  const feedback: DefineFeedback<I, O> = async (req, hook) => {
    const rolls: Function[] = [];
    const context: DefineContext = Object.freeze({
      async useHook<T>(key: string | symbol, callback: () => T | Promise<T>): Promise<T> {
        const value = await Promise.resolve(callback());
        if (hook && hook.has(feedback)) {
          const target = hook.get(feedback);
          if (target.has(key)) {
            const fns = target.get(key);
            await Promise.all(
              Array.from(fns.values())
                .map(fn => Promise.resolve(fn(value)))
            );
          }
        }
        return value;
      },
      async useHookSerial<T>(key: string | symbol, callback: () => T | Promise<T>): Promise<T> {
        let value = await Promise.resolve(callback());
        if (hook && hook.has(feedback)) {
          const target = hook.get(feedback);
          if (target.has(key)) {
            const fns = target.get(key);
            for (const fn of fns) {
              const _value = await Promise.resolve(fn(value));
              if (_value !== undefined) {
                value = _value;
              }
            }
          }
        }
        return value;
      },
      useDefine<T, U>(fn: DefineFeedback<T, U>, req: T): Promise<U> {
        return fn(req, hook);
      },
      useRollback(callback: Function) {
        rolls.push(callback);
      }
    });

    try {
      return await Promise.resolve(callback(req, context));
    } catch (e) {
      let i = rolls.length;
      while (i--) await Promise.resolve(rolls[i]());
      throw e;
    }
    
  }
  return feedback;
}