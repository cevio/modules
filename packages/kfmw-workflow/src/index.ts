import Koa, { Context } from 'koa';
import FindMyWay, { Instance } from 'koa-router-find-my-way';
import { Workflow, Pipeline, Flow, INext, Meta } from '@evio/workflow';
import { createServer, Server } from 'node:http';

export interface IRequest {
  keys?: string[],
  port: number,
  ignoreDuplicateSlashes?: boolean,
  ignoreTrailingSlash?: boolean,
  maxParamLength?: number,
  allowUnsafeRegex?: boolean,
  caseSensitive?: boolean,
}

export interface IResponse {
  koa: Koa,
  fmw: Instance,
  server: Server,
}

@Workflow()
export default class KoaFindMyWayWorkflow extends Pipeline<IRequest, IResponse> {
  public server: Server;
  public readonly koa = new Koa();
  public readonly fmw: Instance;

  static create(props: IRequest) {
    return Meta.execute(KoaFindMyWayWorkflow, props);
  }

  constructor(req: IRequest) {
    super(req, {
      koa: null,
      server: null,
      fmw: null,
    });
    this.fmw = FindMyWay({
      ignoreDuplicateSlashes: req.ignoreDuplicateSlashes,
      ignoreTrailingSlash: req.ignoreTrailingSlash,
      maxParamLength: req.maxParamLength,
      allowUnsafeRegex: req.allowUnsafeRegex,
      caseSensitive: req.caseSensitive,
      // @ts-ignore
      defaultRoute: async (ctx: Context, next: Next) => await next(),
    })
  }

  @Flow(true)
  public async addDefaultMiddleware(next: INext<this>) {
    if (this.req?.keys) {
      this.koa.keys = this.req.keys;
    }
    this.koa.use(this.fmw.routes());
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