# @evio/moduare

模块生命周期控制器，能够根据以来自启动，也能根据依赖自销毁。只要满足启动或销毁条件，即可全部自动处理。

## Install

```bash
$ npm i @evio/moduare
```

## Usage

```ts
import { Component, Module, Dependency, terminateComponent, initializeComponent, listen } from '@evio/moduare';

@Module()
class A extends Component<{ value: number }> {
  public setup() {
    console.log('A inited', this.props.value);
    return () => {
      console.log('A destoryed');
    }
  }
}

@Module()
// 或者使用参数
// @Module({ dependencies: [A] })
class B extends Component<{ value: number }> {
  @Dependency(A) public readonly a: A;
  public async setup() {
    console.log('B inited', this.props.value);
    console.log(this.a);
    return () => {
      console.log('B destoryed');
    }
  }
}

listen(); // 开始监听组件变化

const PromiseA = initializeComponent(A, { value: 1 });
const PromiseB = initializeComponent(B, { value: 2 });
Promise.all([PromiseA, PromiseB])
  // 销毁A将优先销毁B
  .then(() => terminateComponent(A))
  // 重建A后，B即满足条件，B也将重建
  .then(() => initializeComponent(A, { value: 3 }))
```

## initializeComponent

初始化组建，返回一个被初始化的组建对象

**定义：**

```ts
declare function initializeComponent<T extends Component = Component>(clazz: IClazz<T>, props?: PickComponentProps<T>): Promise<T>;
```

**使用：**

```ts
const PromiseA = initializeComponent(A, { value: 1 });
```

> 注意Props为当前使用组件时候的props数据

## terminateComponent

销毁组件

**定义：**

```ts
declare function terminateComponent<T extends Component = Component>(clazz: IClazz<T>): Promise<void>;
```

**使用：**

```ts
const PromiseA = terminateComponent(A);
```

## listen

监听组件变化

**定义：**

```ts
declare function listen(time?: number): () => void;
```

> `time` 是监听时间间隔

**使用：**

```ts
listen(3000); // 3秒一次
```

## Create a new component

构建一个新组件。组件必须继承自模块提供的`Component类`。此类需要指定组件的props类型。定义如下：

```ts
declare abstract class Component<T extends object = {}> {
  __status__: -1 | 0 | 1;
  __terminater__: IComponentSetupReturnType;
  __error__: any;
  readonly meta: Meta<Component<T>>;
  readonly props: T;
  abstract setup(): IComponentSetupReturnType | Promise<IComponentSetupReturnType>;
  constructor(props: T);
}
```

组件还必须具备一个`setup`方法用于初始化和卸载。

```ts
import { Component, Module, Dependency } from '@evio/moduare';

@Module()
class A extends Component<{ value: number }> {
  @Dependency(ABC) private readonly abc: ABC;
  public setup() {
    // 这里运行的代码即是初始化代码
    console.log('A inited', this.props.value);
    this.abc;
    return () => {
      // 这个返回的函数就是卸载时候运行的代码函数
      console.log('A destoryed');
    }
  }
}
```