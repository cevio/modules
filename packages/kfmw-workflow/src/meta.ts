import 'reflect-metadata';
import type { Middleware } from 'koa';
import type { HTTPMethod } from 'find-my-way';
import type { Instance } from 'koa-router-find-my-way';
import { Request } from './request';
import { Meta as WMeta } from '@evio/workflow';
import { HttpException, NextException } from './exception';
import { Route, IClazz, PickRouteRequest, PickRouteResponse } from './route';

type IHander = (e?: any) => unknown | Promise<unknown>;
type IName = 'prepare' | 'commit' | 'rollback' | 'finally';

export class Meta<T extends Route = Route> {
  static readonly namespace = 'metadata.http.koa.find.my.way.namespace';
  public readonly controllers: { method: HTTPMethod, path: string }[] = [];
  public readonly middlewares: Middleware[] = [];
  public readonly transitions = new Map<IName, Set<IHander>>();

  static get<U extends Route = Route>(object: IClazz<U>): Meta<U> {
    if (!Reflect.hasMetadata(Meta.namespace, object)) {
      throw new TypeError('Class module must be wrapped with `@Controller()` decorator.');
    }
    return Reflect.getMetadata(Meta.namespace, object);
  }

  static execute<T extends Route>(clazz: IClazz<T>, props: Request<PickRouteRequest<T>>): Promise<PickRouteResponse<T>> {
    // @ts-ignore
    return WMeta.get(clazz).execute(props);
  }

  constructor(private readonly clazz: IClazz<T>) {}

  private register(fmw: Instance, method: HTTPMethod, path: string) {
    fmw.on(method, path, ...this.middlewares, async (ctx, next) => {
      await this.exec('prepare');
      try {
        ctx.body = await Meta.execute(this.clazz, new Request<PickRouteRequest<T>>(ctx));
        ctx.status = 200;
        await this.exec('commit');
      } catch (e) {
        // 当遇到NextException错误
        // 系统执行下一个中间件
        if (e instanceof NextException) {
          await this.exec('commit');
          return await next();
        }

        // 遇到HttpException错误
        // 根据错误类型执行
        if (e instanceof HttpException) {
          if ([301, 302, 307].includes(e.status)) {
            await this.exec('commit');
            ctx.set(e.toJSONWithHeaders());
            ctx.status = e.status;
            ctx.redirect(e.message);
            return;
          } else if (e.status >= 200 && e.status < 300) {
            await this.exec('commit');
            ctx.set(e.toJSONWithHeaders());
            ctx.status = e.status;
            ctx.body = e.message;
            return;
          }
        }
        
        await this.exec('rollback', e);
        // 未知错误抛出
        throw e;
      } finally {
        await this.exec('finally');
      }
    })
  }

  public mount(fmw: Instance) {
    for (let i = 0; i < this.controllers.length; i++) {
      const { method, path } = this.controllers[i];
      this.register(fmw, method, path);
    }
  }

  public unmount(fmw: Instance) {
    for (let i = 0; i < this.controllers.length; i++) {
      const { method, path } = this.controllers[i];
      fmw.off(method, path);
    }
  }

  public on<N extends IName>(name: N, fn: IHander) {
    if (!this.transitions.has(name)) {
      this.transitions.set(name, new Set());
    }
    this.transitions.get(name).add(fn);
    return this;
  }

  public off<N extends IName>(name: N, fn?: IHander) {
    if (!this.transitions.has(name)) return;
    if (!fn) {
      this.transitions.delete(name);
    } else {
      const fns = this.transitions.get(name);
      if (fns.has(fn)) {
        fns.delete(fn);
      }
      if (!fns.size) {
        this.transitions.delete(name);
      }
    }
    return this;
  }

  public exec<N extends IName>(name: N, e?: any) {
    if (!this.transitions.has(name)) return;
    const fns = this.transitions.get(name);
    return Promise.all(Array.from(fns.values()).map(fn => Promise.resolve(fn(e))));
  }
}

export function Controller(method: HTTPMethod, path: string): ClassDecorator {
  return obj => {
    if (!Reflect.hasMetadata(Meta.namespace, obj)) {
      Reflect.defineMetadata(Meta.namespace, new Meta(obj as any), obj);
    }
    const meta = Reflect.getMetadata(Meta.namespace, obj);
    meta.controllers.push({ method, path });
  }
}

Controller.Middleware = function Middleware(middleware: Middleware): ClassDecorator {
  return obj => {
    if (!Reflect.hasMetadata(Meta.namespace, obj)) {
      Reflect.defineMetadata(Meta.namespace, new Meta(obj as any), obj);
    }
    const meta = Reflect.getMetadata(Meta.namespace, obj);
    if (!meta.middlewares.includes(middleware)) {
      meta.middlewares.unshift(middleware);
    }
  }
};

Controller.Prepare = (fn: IHander): ClassDecorator => {
  return obj => {
    if (!Reflect.hasMetadata(Meta.namespace, obj)) {
      Reflect.defineMetadata(Meta.namespace, new Meta(obj as any), obj);
    }
    const meta: Meta = Reflect.getMetadata(Meta.namespace, obj);
    meta.on('prepare', fn);
  }
}

Controller.Commit = (fn: IHander): ClassDecorator => {
  return obj => {
    if (!Reflect.hasMetadata(Meta.namespace, obj)) {
      Reflect.defineMetadata(Meta.namespace, new Meta(obj as any), obj);
    }
    const meta: Meta = Reflect.getMetadata(Meta.namespace, obj);
    meta.on('commit', fn);
  }
}

Controller.Rollback = (fn: IHander): ClassDecorator => {
  return obj => {
    if (!Reflect.hasMetadata(Meta.namespace, obj)) {
      Reflect.defineMetadata(Meta.namespace, new Meta(obj as any), obj);
    }
    const meta: Meta = Reflect.getMetadata(Meta.namespace, obj);
    meta.on('rollback', fn);
  }
}

Controller.Finally = (fn: IHander): ClassDecorator => {
  return obj => {
    if (!Reflect.hasMetadata(Meta.namespace, obj)) {
      Reflect.defineMetadata(Meta.namespace, new Meta(obj as any), obj);
    }
    const meta: Meta = Reflect.getMetadata(Meta.namespace, obj);
    meta.on('finally', fn);
  }
}