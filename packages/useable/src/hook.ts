import { Node } from './node';
import type { Component } from './types';

export class Hook {
  private readonly stacks = new Map<Component, Node>();

  public use<T extends Component>(component: T) {
    if (!this.has(component)) {
      this.stacks.set(component, new Node());
    }
    return this.stacks.get(component);
  }

  public has<T extends Component>(component: T) {
    return this.stacks.has(component);
  }

  public del<T extends Component>(component: T) {
    if (this.has(component)) {
      this.stacks.delete(component);
    }
  }
}