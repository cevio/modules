export * from './node';

import { Node } from './node';

export type Component<R = any> = () => R | Promise<R>;

const Applications = new Map<Component, Node>();
const RollBacks: (() => unknown | Promise<unknown>)[] = [];

export function LoadComponent<T>(component: Component<T>) {
  if (!Applications.has(component)) {
    return ExecuteComponent(component);
  }
  const node = Applications.get(component);
  return new Promise<T>((resolve, reject) => node.wait(resolve, reject));
}

export function LoadEffect(fn: () => unknown | Promise<unknown>) {
  RollBacks.push(fn);
}

export async function Close() {
  const rollbacks = RollBacks.slice(0);
  RollBacks.length = 0;
  let i = rollbacks.length;
  if (i) {
    while (i--) {
      await Promise.resolve(rollbacks[i]());
    }
    await Close();
  }
}

function ExecuteComponent<T>(component: Component<T>): Promise<T> {
  const node = new Node();
  Applications.set(component, node);
  return Promise.resolve(component())
    .then(res => resolve(node, res))
    .catch(e => reject(node, e))
    .finally(() => node.nofity());
}

function resolve<T>(node: Node, res: T) {
  node.resolve(res);
  return res;
}

function reject(node: Node, e: any) {
  node.reject(e);
  return Promise.reject(e);
}