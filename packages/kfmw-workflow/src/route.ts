import { Pipeline } from '@evio/workflow';
import { Request, IRequestProps } from './request';

export class Route<I extends IRequestProps = IRequestProps, O = any> extends Pipeline<Request<I>, O> {
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