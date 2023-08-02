export class Exception extends Error {
  public readonly status: number;
  constructor(status: number, msg?: string) {
    super(msg);
    this.status = status;
  }
}