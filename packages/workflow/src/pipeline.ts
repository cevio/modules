export type PickPipelineRequest<T> = T extends Pipeline<infer U, any, any> ? U : unknown;
export type PickPipelineResponse<T> = T extends Pipeline<any, infer U, any> ? U : unknown;
export type PickPipelineStorage<T> = T extends Pipeline<any, any, infer U> ? U : unknown;

export class Pipeline<Input = any, Output = any, Storage = any> {
  private readonly __cache__ = new Map<keyof Storage, Storage[keyof Storage]>();
  constructor(
    public readonly req: Input,
    public res: Output,
  ) {}

  public has<T extends keyof Storage>(name: T) {
    return this.__cache__.has(name);
  }

  public set<T extends keyof Storage>(name: T, value: Storage[T]) {
    this.__cache__.set(name, value);
    return this;
  }

  public get<T extends keyof Storage>(name: T) {
    if (!this.has(name)) {
      throw new Error('Property is not executed by name of ' + name.toString());
    }
    return this.__cache__.get(name) as Storage[T];
  }

  public del<T extends keyof Storage>(name: T) {
    if (!this.has(name)) {
      throw new Error('Property is not executed by name of ' + name.toString());
    }
    this.__cache__.delete(name);
    return this;
  }
}