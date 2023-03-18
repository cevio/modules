import 'koa-body';
import type { Context } from "koa";
import type { ParsedUrlQuery } from 'node:querystring';
import type { IncomingHttpHeaders } from 'node:http';
import type { File } from 'formidable';

export interface IHeaders extends IncomingHttpHeaders {
  [key: string]: string | string[],
}

export interface IRequestProps {
  query?: ParsedUrlQuery,
  params?: Record<string, string>,
  body?: any,
  headers?: IHeaders,
  state?: Record<string | symbol, any>,
}

export class Request<T extends IRequestProps = IRequestProps> {
  public readonly params: T['params'] = {};
  public readonly query: T['query'] = {};
  public readonly headers: T['headers'] = {};
  public readonly state: T['state'] = {};
  public readonly files: Record<string, File | File[]> = {};
  public body: T['body'] = null;
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

  public setParam<M extends keyof T['params']>(key: M, value: T['params'][M]) {
    this.params[key] = value;
    return this;
  }

  public setQuery<Q extends keyof T['query']>(key: Q, value: T['query'][Q]) {
    this.query[key] = value;
    return this;
  }

  public setHeader<H extends keyof T['headers']>(key: H, value: T['headers'][H]) {
    this.headers[key] = value;
    return this;
  }

  public setBody(body: T['body']) {
    this.body = body;
    return this;
  }

  public setFile(key: string, value: File | File[]) {
    this.files[key] = value;
    return this;
  }

  public setState<S extends keyof T['state']>(key: S, value: T['state'][S]) {
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