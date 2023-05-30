import { Node } from './node';
import type { DefineFeedback } from './types';

export class Hook extends Map<DefineFeedback<any, any>, Node> {
  public use<I, O>(fn: DefineFeedback<I, O>) {
    if (!this.has(fn)) {
      this.set(fn, new Node());
    }
    return this.get(fn);
  }
}