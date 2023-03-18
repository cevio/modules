export type PickPipelineRequest<T> = T extends Pipeline<infer U, any> ? U : unknown;
export type PickPipelineResponse<T> = T extends Pipeline<any, infer U> ? U : unknown;

export class Pipeline<Input = any, Output = any> extends Map {
  private readonly __rollbacks__: (() => void | Promise<void>)[] = [];
  constructor(
    public readonly req: Input,
    public res: Output,
  ) {
    super();
  }

  public add(fn: () => void | Promise<void>) {
    this.__rollbacks__.push(fn);
    return this;
  }

  public async __rollback__() {
    for (let i = 0; i < this.__rollbacks__.length; i++) {
      const rollback = this.__rollbacks__[i];
      await Promise.resolve(rollback());
    }
  }
}