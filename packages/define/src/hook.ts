import { Node } from './node';
import type { DefineFeedback } from './types';

export class Hook extends Map<DefineFeedback<any, any>, Node> {
  public use<I, O>(fn: DefineFeedback<I, O>) {
    if (!this.has(fn)) {
      this.set(fn, new Node());
    }
    return this.get(fn);
  }

  static merge(...hooks: Hook[]) {
    const hook = new Hook();
    let i = hooks.length;

    while (i--) {
      const current = hooks[i];
      for (const [feedback, node] of current.entries()) {
        if (!hook.has(feedback)) {
          hook.set(feedback, new Node());
        }
        const hookNode = hook.get(feedback);
        for (const [name, stacks] of node) {
          if (!hookNode.has(name)) {
            hookNode.set(name, new Set());
          }
          const local = hookNode.get(name);
          for (const stack of stacks.values()) {
            local.add(stack);
          }
        }
      }
    }

    return hook;
  }
}