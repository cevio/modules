# `@evio/define`

> TODO: description

## Usage

```ts
import { define, Hook } from './index';
const hook = new Hook();
(async () => {
  const c = define(async (props, { useHook }) => {
    const x = await useHook('z', () => {
      return {
        value: 99
      }
    })
    return 100 + x.value
  })
  const a = define(async (props: { a: number }, { useHook, useDefine }) => {
    const x = await useHook('z', () => {
      return {
        b: 199 + props.a
      };
    })
    const km = await useDefine(c);
    return 1 + x.b + km;
  })

  hook.use(a).on('z', (value: { b: number }) => {
    value.b++;
  })

  hook.use(c).on('z', (value: { value: number }) => {
    value.value++;
  })


  const b = await a({ a: 2 }, hook);
  console.log(b)
})()
```