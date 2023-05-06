# `@evio/hookable`

以最简单方式实现 Class hookable 模型。它可以将class作为一个工作流，通过标准的I/O模型产生数据。

## Usage

```ts
import { Hook } from '@pjblog/hookable';
import type { Next } from '@pjblog/hookable';

class ABC extends Hook<number, number> {
  constructor(req: number) {
    super(req, 0);
  }

  @Hook.Main()
  async a(next: Next<this>) {
    this.res += this.req * 2;
    await next('b');
  }

  async b(next: Next<this>) {
    this.res += this.req * 3;
    await next();
  }
}

// invoke

const obj = new ABC(99);

obj.hook('a').before('c', o => {
  console.log('c')
  o.res += 1;
})

obj.hook('a').insertAfter('c', 'd', o => {
  console.log('d')
  o.res += 1;
})

obj.hook('a').insertBefore('c', 'e', o => {
  console.log('e')
  o.res -= 1;
})

obj.execute().then(console.log).catch(console.error);

// output：
// e
// c
// d
// 496
```