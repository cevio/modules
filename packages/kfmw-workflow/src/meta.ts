import 'reflect-metadata';
import { Route } from './route';
import { Request } from './request';
import { HttpException, NextException } from './exception';
import { Meta as WMeta, IClazz, PickPipelineRequest, PickPipelineResponse } from '@evio/workflow';
import type { Middleware } from 'koa';
import type { HTTPMethod } from 'find-my-way';
import type { Instance } from 'koa-router-find-my-way';

export class Meta<T extends Route = Route> {
  static readonly namespace = 'metadata.http.koa.find.my.way.namespace';
  public readonly controllers: { method: HTTPMethod, path: string }[] = [];
  public readonly middlewares: Middleware[] = [];

  static get<U extends Route>(object: IClazz<U>): Meta<U> {
    if (!Reflect.hasMetadata(Meta.namespace, object)) {
      throw new TypeError('Class module must be wrapped with `@Controller()` decorator.');
    }
    return Reflect.getMetadata(Meta.namespace, object);
  }

  static async execute<T extends Route>(clazz: IClazz<T>, props: PickPipelineRequest<T>): Promise<PickPipelineResponse<T>> {
    const obj = await Meta.exec(clazz, props);
    return obj.res;
  }

  static exec<T extends Route>(clazz: IClazz<T>, props: PickPipelineRequest<T>): Promise<T> {
    return WMeta.get(clazz).execute(props);
  }

  constructor(private readonly clazz: IClazz<T>) {}

  private register(fmw: Instance, method: HTTPMethod, path: string) {
    fmw.on(method, path, ...this.middlewares, async (ctx, next) => {
      try {
        ctx.body = await Meta.execute(this.clazz, new Request(ctx) as PickPipelineRequest<T>);
        ctx.status = 200;
      } catch (e) {
        // 当遇到NextException错误
        // 系统执行下一个中间件
        if (e instanceof NextException) {
          return await next();
        }

        // 遇到HttpException错误
        // 根据错误类型执行
        if (e instanceof HttpException) {
          if ([301, 302, 307].includes(e.status)) {
            ctx.set(e.toJSONWithHeaders());
            ctx.status = e.status;
            ctx.redirect(e.message);
            return;
          } else if (e.status >= 200 && e.status < 300) {
            ctx.set(e.toJSONWithHeaders());
            ctx.status = e.status;
            ctx.body = e.message;
            return;
          }
        }
        
        // 未知错误抛出
        throw e;
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

export function Middleware(middleware: Middleware): ClassDecorator {
  return obj => {
    if (!Reflect.hasMetadata(Meta.namespace, obj)) {
      Reflect.defineMetadata(Meta.namespace, new Meta(obj as any), obj);
    }
    const meta = Reflect.getMetadata(Meta.namespace, obj);
    if (!meta.middlewares.includes(middleware)) {
      meta.middlewares.unshift(middleware);
    }
  }
}