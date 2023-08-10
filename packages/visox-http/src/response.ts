import { Context } from "koa";
import { type SetOption } from 'cookies';
import { Stream } from 'node:stream';

export class Response {
  constructor(private readonly ctx: Context) { }

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

  public json<T extends object>(data: T) {
    this.ctx.set('Content-Type', 'application/json; charset=utf-8');
    this.ctx.body = data;
    return this;
  }

  public html(data: string) {
    this.ctx.set('Content-Type', 'text/html; charset=utf-8');
    this.ctx.body = data;
    return this;
  }

  public stream<T extends Stream>(data: T) {
    this.ctx.set('Content-Type', 'application/octet-stream');
    this.ctx.body = data;
    return this;
  }
}