export type PickPipelineProps<T> = T extends Pipeline<infer Request, infer Response>
  ? [Request, Response]
  : [never, never];

type IHandler = (e?: any) => unknown | Promise<unknown>;
type IName = 'prepare' | 'commit' | 'rollback' | 'finally';

export class Pipeline<Input = any, Output = any> extends Map {
  private readonly __transitions__ = new Map<IName, IHandler[]>();

  constructor(
    public readonly req: Input,
    public res: Output,
  ) {
    super();
  }

  public on<T extends IName>(name: T, fn: IHandler) {
    if (!this.__transitions__.has(name)) {
      this.__transitions__.set(name, []);
    }
    const chunks = this.__transitions__.get(name);
    if (!chunks.includes(fn)) {
      if (name === 'rollback') {
        chunks.unshift(fn);
      } else {
        chunks.push(fn);
      }
    }
    return this;
  }

  public off<T extends IName>(name: T, fn?: IHandler) {
    if (!this.__transitions__.has(name)) return;
    if (!fn) {
      this.__transitions__.delete(name);
    } else {
      const chunks = this.__transitions__.get(name);
      const index = chunks.indexOf(fn);
      if (index > -1) {
        chunks.splice(index, 1);
      }
      if (!chunks.length) {
        this.__transitions__.delete(name);
      }
    }
    return this;
  }

  public async __execTransitionsByName__<T extends IName>(name: T, e?: any) {
    if (!this.__transitions__.has(name)) return;
    const chunks = this.__transitions__.get(name);
    for (let i = 0; i < chunks.length; i++) {
      await Promise.resolve(chunks[i](e));
    }
    return this;
  }
}