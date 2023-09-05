import FindMyWay from 'koa-router-find-my-way';
import Koa, { Context, Next, Middleware } from 'koa';
import { randomBytes } from 'crypto';
import { useEffect } from '@evio/visox';
import { createServer, Server } from 'node:http';
import { LoadFiles, type LoadFilesProps } from './files';
import { type Request } from './request';

export * from './exception';
export * from './files';
export * from './request';
export * from './response';

export interface Props<T extends Request = Request> {
  port: number,
  middlewares?: Middleware[],
  controllers: LoadFilesProps,
  createRequest?: (ctx: Context) => T,
  onServer?(server: Server): unknown | Promise<unknown>,
}

export function createHttpServer<T extends Request = Request>(props: Props<T> | (() => Props<T> | Promise<Props<T>>)) {
  return async () => {
    const _props = typeof props === 'function'
      ? await Promise.resolve(props())
      : props;
    const koa = new Koa();
    const keys = koa.keys = [randomBytes(32).toString(), randomBytes(64).toString()];
    const app = FindMyWay({
      ignoreDuplicateSlashes: true,
      ignoreTrailingSlash: true,
      maxParamLength: +Infinity,
      allowUnsafeRegex: true,
      caseSensitive: true,
      // @ts-ignore
      defaultRoute: async (ctx: Context, next: Next) => await next(),
    })

    koa.use(async (ctx, next) => {
      if (typeof _props.createRequest === 'function') {
        ctx.state.createRequest = _props.createRequest;
      }
      await next();
    })

    if (_props.middlewares) {
      _props.middlewares.forEach(
        middleware => koa.use(middleware)
      );
    }

    koa.use(app.routes());

    const server = createServer(koa.callback());
    if (_props.onServer) {
      await Promise.resolve(_props.onServer(server));
    }
    await new Promise<void>((resolve, reject) => {
      server.listen(_props.port, (err?: any) => {
        if (err) return reject(err);
        resolve();
      })
    })
    useEffect(() => server.close());

    await LoadFiles(app, _props.controllers);

    return {
      koa, app, server, keys,
    }
  }
}