# `@evio/hookable`

以最简单方式实现 Class hookable 模型。它可以将class作为一个工作流，通过标准的I/O模型产生数据。

## Usage

```ts
import { Hook } from '@pjblog/hookable';
import type { Next } from '@pjblog/hookable';

class ABC extends Hook<number, number, [number]> {
  public res = 0;
  
  @Hook.Node
  public async initialize(a: number) {
    this.res += this.req * 2 + a;
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

obj.$hook('initialize').before('c', o => {
  console.log('c')
  o.res += 1;
})

obj.$hook('initialize').insertAfter('c', 'd', o => {
  console.log('d')
  o.res += 1;
})

obj.$hook('initialize').insertBefore('c', 'e', o => {
  console.log('e')
  o.res -= 1;
})

obj.$execute(35).then(console.log).catch(console.error);

// output：
// e
// c
// d
// 536
```