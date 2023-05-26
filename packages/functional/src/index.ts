import type { Hook } from './hook';
import type { ComponentRender } from './types';

export * from './component';
export * from './types';
export * from './hook';
export * from './node';

export function execute<T extends (...args: any[]) => any>(object: ComponentRender<T>, hook?: Hook) {
  return object(hook);
}