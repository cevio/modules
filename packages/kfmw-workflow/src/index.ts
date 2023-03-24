import Koa, { Context } from 'koa';
import FindMyWay, { Instance } from 'koa-router-find-my-way';
import { Workflow, Pipeline, Flow, INext, Meta } from '@evio/workflow';
import { createServer, Server } from 'node:http';
import { koaBody, KoaBodyMiddlewareOptions } from 'koa-body';

export type IRouteSkipper = (ctx: Context) => boolean | Promise<boolean>;
export interface IRequest {
  keys?: string[],
  port: number,
  body?: KoaBodyMiddlewareOptions,
  skip?: IRouteSkipper,
  router?: {
    ignoreDuplicateSlashes?: boolean,
    ignoreTrailingSlash?: boolean,
    maxParamLength?: number,
    allowUnsafeRegex?: boolean,
    caseSensitive?: boolean,
  }
}

export interface IResponse {
  koa: Koa,
  fmw: Instance,
  server: Server,
}

export * from './meta';
export * from './request';
export * from './route';

@Workflow()
export default class KoaFindMyWayWorkflow extends Pipeline<IRequest, IResponse> {
  public server: Server;
  public readonly koa = new Koa();
  public readonly fmw: Instance;

  static async create(props: IRequest) {
    const obj = await Meta.execute(KoaFindMyWayWorkflow, props);
    return obj.res;
  }

  static hook<T extends keyof KoaFindMyWayWorkflow>(name: T) {
    return Meta.get(KoaFindMyWayWorkflow).hook(name);
  }

  constructor(req: IRequest) {
    const routerOptions = req.router || {};
    super(req, {
      koa: null,
      server: null,
      fmw: null,
    });
    this.fmw = FindMyWay({
      ignoreDuplicateSlashes: routerOptions.ignoreDuplicateSlashes,
      ignoreTrailingSlash: routerOptions.ignoreTrailingSlash,
      maxParamLength: routerOptions.maxParamLength,
      allowUnsafeRegex: routerOptions.allowUnsafeRegex,
      caseSensitive: routerOptions.caseSensitive,
      // @ts-ignore
      defaultRoute: async (ctx: Context, next: Next) => await next(),
    })
  }

  @Flow(true)
  public async setKeys(next: INext<this>) {
    if (this.req?.keys) {
      this.koa.keys = this.req.keys;
    }
    await next('addKoaBody');
  }

  @Flow()
  public async addKoaBody(next: INext<this>) {
    this.koa.use(koaBody(this.req.body));
    await next('addRouters');
  }

  @Flow()
  public async addRouters(next: INext<this>) {
    if ( typeof this.req.skip === 'function') {
      this.koa.use(async (ctx, next) => {
        if (await Promise.resolve(this.req.skip(ctx))) {
          return await next();
        }
        await this.fmw.routes()(ctx, next);
      })
    } else {
      this.koa.use(this.fmw.routes());
    }
    await next('createServer');
  }

  @Flow()
  public async createServer(next: INext<this>) {
    this.server = createServer(this.koa.callback());
    await next('listen');
  }

  @Flow()
  public async listen(next: INext<this>) {
    await new Promise<void>((resolve, reject) => {
      this.server.listen(this.req.port, (err?: any) => {
        if (err) return reject(err);
        resolve();
      })
    })
    await next('response');
  }

  @Flow()
  public async response(next: INext<this>) {
    this.res.koa = this.koa;
    this.res.fmw = this.fmw;
    this.res.server = this.server;
    await next();
  }
}