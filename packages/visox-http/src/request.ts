import { type Context } from "koa";
import { Response } from './response';

export class Request<P extends string = any> {
  constructor(private readonly ctx: Context) { }

  public getParam(key: P, defaultValue?: string): string {
    return this.ctx.params[key] || defaultValue;
  }

  public getHeader(key: string, defaultValue?: string): string {
    return (this.ctx.headers[key] as string) || defaultValue;
  }

  public getHeaders(key: string): string[] {
    const value = this.ctx.headers[key] as string[];
    if (!value) return [];
    if (Array.isArray(value)) return value;
    return [value];
  }

  public getQuery(key: string, defaultValue?: string): string {
    return (this.ctx.query[key] as string) || defaultValue;
  }

  public getQueries(key: string): string[] {
    const value = this.ctx.query[key] as string[];
    if (!value) return [];
    if (Array.isArray(value)) return value;
    return [value];
  }

  public response(body?: any) {
    const res = new Response(this.ctx);
    if (body) res.body(body);
    return res;
  }
}