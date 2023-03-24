export class NextException {}
export class HttpException extends Error {
  private readonly headers = new Map<string, string | number | boolean>();
  public readonly status: number;
  public code: string;
  constructor(status: number, msg?: any) {
    super(msg);
    this.status = status;
    this.code = 'E' + status;
  }

  public setCode(code: string) {
    this.code = code;
    return this;
  }

  public setHeader(key: string, value: string | number | boolean) {
    this.headers.set(key, value);
    return this;
  }

  public toJSONWithHeaders() {
    const obj: Record<string, string> = {};
    for (const [key, value] of this.headers.entries()) {
      obj[key] = value + '';
    }
    return obj;
  }
}