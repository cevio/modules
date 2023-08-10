import { Context } from "koa";
import { type SetOption } from 'cookies';

export class Response {
  constructor(private readonly ctx: Context) { }

  static readonly JSONKEY = Symbol('response-type');

  public headers(field: { [key: string]: string | string[]; }) {
    this.ctx.set(field);
    return this;
  }

  public status(i: number) {
    this.ctx.status = i;
    return this;
  }

  public body(body: any = null) {
    this.ctx.body = body;
    return this;
  }

  public redirect(url: string, alt?: string) {
    this.ctx.redirect(url, alt);
    return this;
  }

  public cookie(name: string, value?: string, opts?: SetOption) {
    this.ctx.cookies.set(name, value, opts);
    return this;
  }

  public json(data: any) {
    this.ctx.body = data;
    this.ctx[Response.JSONKEY] = true;
    return this;
  }
}