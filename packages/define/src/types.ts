import type { Hook } from './hook';
export type DefineFeedback<I, O> = (req: I, hook?: Hook) => Promise<O>;
export type UseHook = <T>(key: string | symbol, callback: () => T | Promise<T>) => Promise<T>;
export type UseDefine = <I, O>(fn: DefineFeedback<I, O>, req?: I) => Promise<O>;
export type DefineHandler<T, O> = (props: T, context: Readonly<DefineContext>) => O | Promise<O>;
export interface DefineContext {
  useHook: UseHook,
  useHookSerial: UseHook,
  useDefine: UseDefine,
  useRollback: (callback: Function) => void
}