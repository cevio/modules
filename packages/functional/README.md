# @evio/functional

函数式hookable

## Usage

```ts
import { Props, createComponent, Hook, execute } from '@evio/functional';

const hook = new Hook();

hook.use(FFF).on('test', (obj: { c: number }) => {
  obj.c += 99
})

async function FFF(props: Props<{}>) {
  const { c } = await props.useHook('test', () => {
    return {
      c: 1
    }
  })
  return 'ddd' + c
}

function ABC(props: Props<{}, [string]>) {
  return {
    name: 'abc',
    value: props.children[0]
  }
}

function KKK(props: Props<{}, [ReturnType<typeof ABC>]>) {
  return <ABC>
    <FFF />
  </ABC>
}

execute(<KKK />, hook).then(console.log)
```


output:

```bash
evioshen@shenyunjiedeMBP 111 % ts-node src/index.tsx       
{ name: 'abc', value: 'ddd100' }
evioshen@shenyunjiedeMBP 111 % tsc -d                      
evioshen@shenyunjiedeMBP 111 % node dist/index.js          
{ name: 'abc', value: 'ddd100' }
```