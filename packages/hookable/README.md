# `@evio/hookable`

以最简单方式实现 Class hookable 模型。它可以将class作为一个工作流，通过标准的I/O模型产生数据。

## Usage

```ts
import { Hook } from '@pjblog/hookable';

class ABC extends Hook<number, number> {
  public res = 0;
  
  @Hook.Entry
  @Hook.Node
  public async a() {
    this.res += this.req * 2;
    const j = await this.b(4);
    this.res += j;
  }

  @Hook.Node
  async b(a: number) {
    this.res += this.req * 3 + a;
    return 1;
  }
}

// invoke

const obj = new ABC(99);

obj.$hook('b').before('c', o => {
  console.log('c')
  o.res += 1;
})

obj.$hook('b').insertAfter('c', 'd', o => {
  console.log('d')
  o.res += 1;
})

obj.$hook('b').insertBefore('c', 'e', o => {
  console.log('e')
  o.res -= 1;
})

obj.$execute().then(console.log).catch(console.error);

// output：
// e
// c
// d
// 501
```

## Use Container

使用全局注册

```ts
import { Hook } from '@pjblog/hookable';
@Hook.Container
class ABC extends Hook<number, number> {
  public res = 0;
  
  @Hook.Entry
  @Hook.Node
  public async a() {
    this.res += this.req * 2;
    const j = await this.b(4);
    this.res += j;
  }

  @Hook.Node
  async b(a: number) {
    this.res += this.req * 3 + a;
    return 1;
  }
}

const unbind = Hook.use(ABC, abc => {
  abc.$hook('a').after('k', obj => {
    console.log('k')
    obj.res += 1;
  })
})

// invoke

const obj = new ABC(99);

obj.$hook('b').before('c', o => {
  console.log('c')
  o.res += 1;
})

obj.$hook('b').insertAfter('c', 'd', o => {
  console.log('d')
  o.res += 1;
})

obj.$hook('b').insertBefore('c', 'e', o => {
  console.log('e')
  o.res -= 1;
})

obj.$execute().then(console.log).catch(console.error);

setTimeout(() => {
  unbind();
  console.log('-----------')
  const x = new ABC(99);
  x.$execute().then(console.log).catch(console.error);
}, 2000);

// output:
// e
// c
// d
// k
// 502
// -----------
// 500
```