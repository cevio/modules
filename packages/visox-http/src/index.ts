import FindMyWay from 'koa-router-find-my-way';
import Koa, { Context, Next, Middleware } from 'koa';
import { randomBytes } from 'crypto';
import { useEffect } from '@evio/visox';
import { createServer } from 'node:http';
import { LoadFiles, type LoadFilesProps } from './files';
import { type Request } from './request';

export * from './exception';
export * from './files';
export * from './request';
export * from './response';

export interface Props {
  port: number,
  middlewares?: Middleware[],
  controllers: LoadFilesProps,
  createRequest?: <T extends Request>(ctx: Context) => T,
}

export function createHttpServer(props: Props) {
  return async () => {
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
      if (typeof props.createRequest === 'function') {
        ctx.state.createRequest = props.createRequest;
      }
      await next();
    })

    if (props.middlewares) {
      props.middlewares.forEach(
        middleware => koa.use(middleware)
      );
    }

    koa.use(app.routes());

    const server = createServer(koa.callback());
    await new Promise<void>((resolve, reject) => {
      server.listen(props.port, (err?: any) => {
        if (err) return reject(err);
        resolve();
      })
    })
    useEffect(() => server.close());

    await LoadFiles(app, props.controllers);

    return {
      koa, app, server, keys,
    }
  }
}