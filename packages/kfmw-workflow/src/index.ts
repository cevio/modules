import Koa, { Context } from 'koa';
import FindMyWay, { Instance } from 'koa-router-find-my-way';
import { Workflow, Pipeline, Flow, INext, getMeta } from '@evio/workflow';
import { createServer, Server } from 'node:http';

export interface IKoaFindMyWayWorkflowRequestProps {
  keys: string[],
  port: number,
}

export interface IKoaFindMyWayWorkflowResponseProps {
  koa: Koa,
  fmw: Instance,
  server: Server,
}

@Workflow()
export class KoaFindMyWayWorkflow extends Pipeline<
  IKoaFindMyWayWorkflowRequestProps, 
  IKoaFindMyWayWorkflowResponseProps
> {
  private server: Server;
  private readonly koa = new Koa();
  private readonly fmw = FindMyWay({
    maxParamLength: +Infinity,
    caseSensitive: true,
    ignoreTrailingSlash: true,
    allowUnsafeRegex: true,
    // @ts-ignore
    defaultRoute: async (ctx: Context, next: Next) => await next(),
  })
  constructor(req: IKoaFindMyWayWorkflowRequestProps) {
    super(req, {
      koa: null,
      server: null,
      fmw: null,
    });
  }

  @Flow(true)
  public async addDefaultMiddleware(next: INext<this>) {
    this.koa.use(async (ctx, next) => {
      await this.fmw.routes()(ctx, next);
    });
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
  public response() {
    this.res.koa = this.koa;
    this.res.fmw = this.fmw;
    this.res.server = this.server;
  }
}

export function createApplication(props: IKoaFindMyWayWorkflowRequestProps) {
  return getMeta(KoaFindMyWayWorkflow).execute(props);
}