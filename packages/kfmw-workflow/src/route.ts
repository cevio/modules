import { Pipeline } from '@evio/workflow';
import { Request } from './request';

export interface IClazz<T extends Route = Route> {
  new (req: PickRouteRequest<T>): T;
}

export type PickRouteRequest<T> = T extends Route<infer U, any, any> ? U : unknown;
export type PickRouteResponse<T> = T extends Route<any, infer U, any> ? U : unknown;
export type PickRouteStorage<T> = T extends Route<any, any, infer U> ? U : unknown;

export class Route<I extends Request = Request, O = any, S = any> extends Pipeline<I, O, S> {
  get ctx() {
    return this.req.ctx;
  }

  public addCookie(key: string, value: string, maxAge: number) {
    const expires = new Date(Date.now() + maxAge);
    this.ctx.cookies.set(key, value, {
      path: '/',
      signed: true,
      httpOnly: true,
      maxAge,
      expires,
    })
    return expires;
  }

  public delCookie(key: string) {
    this.ctx.cookies.set(key, '', {
      path: '/',
      signed: true,
      httpOnly: true,
      maxAge: 0,
      expires: new Date(0),
    })
  }
}