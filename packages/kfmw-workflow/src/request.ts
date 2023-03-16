import 'koa-body';
import type { Context } from "koa";
import type { ParsedUrlQuery } from 'node:querystring';
import type { IncomingHttpHeaders } from 'node:http';
import type { File } from 'formidable';

export interface IHeaders extends IncomingHttpHeaders {
  [key: string]: string | string[],
}

export class Request<IBody = unknown> {
  public readonly params: Record<string, string> = {};
  public readonly query: ParsedUrlQuery = {};
  public readonly headers: IHeaders = {};
  public readonly state: Record<string | symbol, any> = {};
  public readonly files: Record<string, File | File[]> = {};
  public body: IBody = null;
  public ip: string = null;
  public cookies: Context['cookies'] = null;
  
  constructor(public readonly ctx?: Context) {
    if (ctx) {
      this.params = ctx.params || {};
      this.query = ctx.query || {};
      this.headers = ctx.headers || {};
      this.body = ctx.request?.body;
      this.files = ctx.request?.files || {};
      this.state = ctx.state || {};
      this.ip = ctx.ip;
      this.cookies = ctx.cookies;
    }
  }

  public setParam(key: string, value: string) {
    this.params[key] = value;
    return this;
  }

  public setQuery(key: string, value: string | string[]) {
    this.query[key] = value;
    return this;
  }

  public setHeader(key: string, value: string | string[]) {
    this.headers[key] = value;
    return this;
  }

  public setBody(body: IBody) {
    this.body = body;
    return this;
  }

  public setFile(key: string, value: File | File[]) {
    this.files[key] = value;
    return this;
  }

  public setState(key: string | symbol, value: any) {
    this.state[key] = value;
    return this;
  }

  public setIp(value: string) {
    this.ip = value;
    return this;
  }

  public setCookie(value: Context['cookies']) {
    this.cookies = value;
    return this;
  }
}