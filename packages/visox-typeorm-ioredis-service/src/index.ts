import { DataSource, QueryRunner, EntityTarget } from 'typeorm';
import { Redis } from 'ioredis';
import { OriginFunction, Cache, Transformer } from '@evio/visox-ioredis';
export type TypeORMConnection = DataSource | QueryRunner;

export class Service {
  private readonly stacks = new Map<Function, Cache>();
  constructor(
    public readonly conn: TypeORMConnection,
    public readonly redis: Redis,
    private readonly keyWrapper?: (key: string) => string,
  ) {
    const proto = this.constructor.prototype;
    if (Reflect.hasMetadata(Service.CacheNameSpace, proto)) {
      const map: Map<string, Transformer> = Reflect.getMetadata(Service.CacheNameSpace, proto);
      for (const [method, transformer] of map) {
        // @ts-ignore
        const fn: OriginFunction = this[method];
        const cache = new Cache(this.redis, fn.bind(this), transformer, this.keyWrapper);
        this.stacks.set(fn, cache);
      }
    }
  }

  public getRepository<T>(target: EntityTarget<T>) {
    return this.conn.manager.getRepository(target);
  }

  public getCache<T extends OriginFunction>(fn: T) {
    if (!this.stacks.has(fn)) throw new Error('This is not a cacheable function');
    return this.stacks.get(fn) as Cache<T>;
  }

  static readonly CacheNameSpace = 'Service.Cache';
  static Cache<T extends OriginFunction>(callback: string | Transformer<T>): MethodDecorator {
    return (obj, property) => {
      const target = obj.constructor.prototype;
      if (!Reflect.hasMetadata(Service.CacheNameSpace, target)) {
        Reflect.defineMetadata(Service.CacheNameSpace, new Map(), target);
      }
      const map = Reflect.getMetadata(Service.CacheNameSpace, target);
      map.set(property, typeof callback === 'string' ? () => [callback] : callback);
    }
  }
}