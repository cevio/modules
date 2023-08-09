import { glob } from 'glob';
import { resolve } from 'node:path';
import { Instance } from 'koa-router-find-my-way';
import { type HTTPMethod } from 'find-my-way';
import { Context, Next, type Middleware } from 'koa';
import { compile, type PathFunction } from 'path-to-regexp';
import { useEffect } from '@evio/visox';
import { Request } from './request';
import { Response } from './response';

type ReturnTypeDefineRouter<T extends string = any> = ReturnType<typeof defineRouter<T>>;
export type DefineResolver<T extends string = any> = (req: Request<T>) => Response | Promise<Response>;

export interface LoadFilesProps {
  directory: string | string[],
  suffix?: string,
}

function defineRouter<T extends string = any>(methods: HTTPMethod | HTTPMethod[], ...Middlewares: Middleware[]) {
  let expression: string;
  let toPath: PathFunction<Record<T, string>>;

  const CreateExpression = (path: string) => {
    path = path.startsWith('/') ? path : '/' + path;
    if (path.endsWith('/index')) {
      path = path.substring(0, path.length - 6);
    }
    if (!path) {
      path = '/';
    }
    expression = path;
    toPath = compile<Record<T, string>>(path, { encode: encodeURIComponent });
  }

  const Mount = (fwm: Instance) => fwm.on(methods, expression, ...Middlewares);
  const UnMount = (fwm: Instance) => fwm.off(methods, expression);

  return {
    mount: Mount,
    unmount: UnMount,
    create: CreateExpression,
    toPath,
  }
}

export function defineController<T extends string = any>(methods: HTTPMethod | HTTPMethod[], Middlewares: Middleware[], handler: DefineResolver<T>) {
  const handlerMiddleware = async (ctx: Context, next: Next) => {
    const req = typeof ctx.state.createRequest === 'function'
      ? ctx.state.createRequest(ctx)
      : new Request<T>(ctx);
    const res = await Promise.resolve(handler(req));
    if (!res) return await next();
  }
  return defineRouter(methods, ...Middlewares.concat([handlerMiddleware]));
}

export async function LoadFiles(instance: Instance, props: LoadFilesProps) {
  if (!props.suffix) props.suffix = 'com';
  if (!Array.isArray(props.directory)) {
    props.directory = [props.directory];
  }

  const directories = props.directory as string[];

  for (let j = 0; j < directories.length; j++) {
    const directory = directories[j];
    const files = await glob(`**/*.${props.suffix}.{ts,js}`, { cwd: directory });

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      let response = await importDynamic<ReturnTypeDefineRouter | ReturnTypeDefineRouter[]>(resolve(directory, file));
      if (!Array.isArray(response)) {
        response = [response];
      }
      const path = file.substring(0, file.length - (4 + props.suffix.length));
      response.forEach(({ create, mount, unmount }) => {
        create(path);
        mount(instance);
        useEffect(() => unmount(instance));
      })
    }
  }
}

export function importDynamic<T = any>(file: string): Promise<T> {
  return Promise.resolve(require(file).default);
}