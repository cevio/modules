import 'reflect-metadata';
import { Pipeline, PickPipelineProps } from './pipeline';
import { Node } from './node';

export interface IClazz<T> {
  new (req: PickPipelineProps<T>[0]): T;
}

export type INext<T extends Pipeline> = (name?: keyof T) => Promise<void>;

export class Meta<T extends Pipeline> {
  static readonly namespace = 'metadata.workflow.namespace';
  private readonly stacks = new Map<keyof T, Node<T>>();
  public enterence: keyof T = null;

  static async execute<U extends Pipeline>(clazz: IClazz<U>, props: PickPipelineProps<U>[0]): Promise<PickPipelineProps<U>[1]> {
    const obj = await Meta.exec(clazz, props);
    return obj.res;
  }

  static exec<U extends Pipeline>(clazz: IClazz<U>, props: PickPipelineProps<U>[0]): Promise<U> {
    return Meta.get(clazz).execute(props);
  }

  static get<U extends Pipeline>(object: IClazz<U>): Meta<U> {
    if (!Reflect.hasMetadata(Meta.namespace, object)) {
      throw new TypeError('Class module must be wrapped with `@Workflow()` decorator.');
    }
    return Reflect.getMetadata(Meta.namespace, object);
  }

  constructor(public readonly clazz: IClazz<T>) {}

  public addStack(name: keyof T, fn: Node<T>) {
    this.stacks.set(name, fn);
    return this;
  }

  public async execute(req: PickPipelineProps<T>[0]): Promise<T> {
    const obj = new this.clazz(req);
    if (this.enterence && this.stacks.has(this.enterence)) {
      await obj.__execTransitionsByName__('prepare');
      try {
        await this.run(this.enterence, obj);
        await obj.__execTransitionsByName__('commit');
      } catch (e) {
        await obj.__execTransitionsByName__('rollback', e);
        throw e;
      } finally {
        await obj.__execTransitionsByName__('finally');
      }
    }
    return obj;
  }

  private async run(name: keyof T, obj: T) {
    if (!this.stacks.has(name)) throw new Error('No process named `' + name.toString() + '`');
    // @ts-ignore
    if (typeof obj[name] !== 'function') throw new TypeError(`class name [${name.toString()}] is not a function`);
    const node = this.stacks.get(name);
    const next: INext<T> = async n => {
      await node.executeInSuffix(obj);
      if (n) {
        await this.run(n, obj);
      }
    }
    await node.executeInPrefix(obj);
    if (typeof obj[name] === 'function') {
      // @ts-ignore
      await Promise.resolve(obj[name](next));
    }
  }

  public hook(name: keyof T) {
    if (!this.stacks.has(name)) {
      throw new Error(`'${name.toString()}' is not a hook`);
    }
    return this.stacks.get(name) as Node<T>;
  }
}

export function Workflow(): ClassDecorator {
  return obj => {
    if (!Reflect.hasMetadata(Meta.namespace, obj)) {
      Reflect.defineMetadata(Meta.namespace, new Meta(obj as any), obj);
    }
  }
}

export function Flow<T extends Pipeline>(enterence: boolean = false): MethodDecorator {
  return (obj, key) => {
    const ctor = obj.constructor as IClazz<T>;

    if (!Reflect.hasMetadata(Meta.namespace, ctor)) {
      Reflect.defineMetadata(Meta.namespace, new Meta(ctor), ctor);
    }

    const meta: Meta<T> = Reflect.getMetadata(Meta.namespace, ctor);
    const node = new Node<T>();

    meta.addStack(key as any, node);

    if (enterence) {
      if (meta.enterence) {
        throw new TypeError('Flow enterence has already be setted by name `' + meta.enterence.toString() + '`');
      }
      meta.enterence = key as any;
    }
  }
}