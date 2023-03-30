import 'reflect-metadata';
import { Component, IClazz, PickComponentProps } from "./component";
import { EventEmitter } from 'node:events';

export type IMetaCommader = 'initialize' | 'terminate';
export interface IModuleProps {
  dependencies?: IClazz[],
}

export class Meta<T extends Component = Component> extends EventEmitter {
  static readonly namespace = 'metadata.class.namespace';
  public instance: T = null;
  public commander: IMetaCommader = 'initialize';
  public readonly dependencies = new Set<IClazz>();
  public readonly dependents = new Set<IClazz>();
  public readonly keys = new Map<IClazz, (string | Symbol)[]>();
  public readonly state: any = {};

  static get<T extends Component = Component>(clazz: IClazz<T>): Meta<T> {
    if (!Reflect.hasMetadata(Meta.namespace, clazz)) {
      throw new TypeError('Class module must be wrapped with `@Module()` decorator.');
    }
    return Reflect.getMetadata(Meta.namespace, clazz);
  }

  static component<T extends Component = Component>(clazz: IClazz<T>): T {
    const meta = Meta.get<T>(clazz);
    if (!meta.instance) throw new Error('Component has not been initialized.');
    if (meta.instance.__status__ === 0) throw new Error('Component initialing...');
    if (meta.instance.__status__ === -1) throw meta.instance.__error__;
    return meta.instance;
  }

  constructor(public readonly clazz: IClazz<T>) {
    super();
    this.setMaxListeners(+Infinity);
  }

  public addDependency<T extends Component = Component>(clazz: IClazz<T>) {
    const _meta = Meta.get(clazz);
    if (!_meta.dependents.has(this.clazz)) {
      _meta.dependents.add(this.clazz);
    }
    if (!this.dependencies.has(clazz)) {
      this.dependencies.add(clazz);
    }
    return this;
  }

  public initialize(props: PickComponentProps<T>) {
    this.instance = new this.clazz(props);
    this.instance.__status__ = 0;
    Promise.resolve(this.instance.setup())
      .then(terminater => {
        if (typeof terminater === 'function') {
          this.instance.__terminater__ = terminater;
        }
        this.instance.__status__ = 1;
        this.emit('initialize');
      })
      .catch(e => {
        this.instance.__status__ = -1;
        this.instance.__error__ = e;
        this.emit('initialize', e);
      })
  }

  public terminate() {
    const instance = this.instance;
    if (typeof instance.__terminater__ !== 'function') {
      this.instance = null;
      this.emit('terminate');
      return;
    }

    const terminater = instance.__terminater__;
    instance.__status__ = 0;
    instance.__terminater__ = null;
    Promise.resolve(terminater())
      .then(() => instance.__status__ = 1)
      .then(() => this.emit('terminate'))
      .catch(e => {
        instance.__status__ = -1;
        instance.__error__ = e;
        this.emit('terminate', e);
      })
      .finally(() => this.instance = null);
  }
}

export function Module(options: IModuleProps = {}): ClassDecorator {
  return obj => {
    if (!Reflect.hasMetadata(Meta.namespace, obj)) {
      Reflect.defineMetadata(Meta.namespace, new Meta(obj as any), obj);
    }
    const meta: Meta = Reflect.getMetadata(Meta.namespace, obj);
    const dependencies = options.dependencies || [];
    dependencies.forEach(dependency => {
      Meta.get(dependency).dependents.add(obj as any);
      if (!meta.dependencies.has(dependency)) {
        meta.dependencies.add(dependency);
      }
    })
  }
}

export function Dependency<T extends Component = Component>(clazz: IClazz<T>): PropertyDecorator {
  return (obj, key) => {
    const ctor = obj.constructor as IClazz<T>;
    Meta.get(clazz).dependents.add(ctor);

    if (!Reflect.hasMetadata(Meta.namespace, ctor)) {
      Reflect.defineMetadata(Meta.namespace, new Meta(ctor), ctor);
    }

    const meta: Meta = Reflect.getMetadata(Meta.namespace, ctor);

    if (!meta.dependencies.has(clazz)) {
      meta.dependencies.add(clazz);
    }

    if (!meta.keys.has(clazz)) {
      meta.keys.set(clazz, []);
    }

    const keys = meta.keys.get(clazz);
    if (!keys.includes(key)) {
      keys.push(key);
    }
  }
}