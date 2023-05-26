# @evio/functional

函数式hookable

## Usage

```ts
import { createComponent, Props, Hook } from '@evio/functional';
const hook = new Hook();


hook.use(A).on('a', (res: any) => {
  res.value++;
  res.value++;
  res.value++;
  res.value++;
})

async function A(props: Props<{ a: number }, [string, boolean, string, ...any[]]>) {
  const { a, children, useHook } = props;
  const [user, paten, bol, ...other] = children;
  const x = await useHook('a', () => {
    return {
      value: 1
    }
  })
  return {
    aa: 1 + a,
    user,
    paten,
    bol,
    extra: other,
    x
  }
}

function B(props: Props<{ b: number }, [string, number]>) {
  return (props.b + 100) + props.children[0] + props.children[1];
}

function c() {
  return 'evio'
}

const result = createComponent(
  A, 
  { a: 562 }, 
  createComponent(B, { b: 19 }, createComponent(c), 999),
  true,
  'hello world',
  '4535'
)

result(hook).then(console.log);
```