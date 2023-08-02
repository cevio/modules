import { Redis } from 'ioredis';

export type OriginFunction = (...args: any[]) => any | Promise<any>;
export type GetPromiseValue<T extends OriginFunction = OriginFunction> = ReturnType<T> extends Promise<infer U> ? U : ReturnType<T>;
export type Transformer<F extends OriginFunction = OriginFunction> = (val: GetPromiseValue<F>) => [string, number?];

export class Cache<F extends OriginFunction = OriginFunction> {
  constructor(
    private readonly redis: Redis,
    private readonly builder: F,
    private readonly transformer: Transformer<F>,
    private readonly keyWrapper?: (key: string) => string,
  ) { }

  private createPath(key: string) {
    return this.keyWrapper ? this.keyWrapper(key) : key;
  }

  public async write(...args: Parameters<F>): Promise<GetPromiseValue<F>> {
    const result = await Promise.resolve(this.builder(...args));
    const [key, expire] = await Promise.resolve(this.transformer(result));
    const path = this.createPath(key);
    if (expire) {
      await this.redis.setex(path, expire, JSON.stringify(result));
    } else {
      await this.redis.set(path, JSON.stringify(result));
    }
    return result;
  }

  public async read(key: string): Promise<GetPromiseValue<F> | undefined> {
    const path = this.createPath(key);
    if (!(await this.redis.exists(path))) return;
    const text = await this.redis.get(path);
    return JSON.parse(text);
  }

  public async remove(key: string) {
    const path = this.createPath(key);
    if (!(await this.redis.exists(path))) return;
    await this.redis.del(path);
  }
}