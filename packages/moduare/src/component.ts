import { Meta } from './meta';

export type IComponentSetupReturnType = void | Promise<void> | (() => void | Promise<void>);
export type PickComponentProps<T> = T extends Component<infer P> ? P : unknown;
export interface IClazz<T extends Component = Component> {
  new(props: PickComponentProps<T>): T;
}

export abstract class Component<T extends object = {}> {
  public __status__: -1 | 0 | 1 = 0;
  public __terminater__: IComponentSetupReturnType = null;
  public __error__: any = null;
  public readonly meta: Meta<Component<T>>;
  public readonly props: T;
  public abstract setup(): IComponentSetupReturnType | Promise<IComponentSetupReturnType>;
  constructor(props: T) {
    this.props = props;
    this.meta = Meta.get<Component<T>>(Object.getPrototypeOf(this).constructor);
    for (const [clazz, keys] of this.meta.keys.entries()) {
      const node = Meta.component(clazz);
      keys.forEach(key => {
        // @ts-ignore
        this[key] = node;
      });
    }
  }
}