import { Component, IClazz, PickComponentProps } from './component';
import { getMeta, Meta, IMetaCommader } from './meta';

const components = new Map<Meta, any>();

export function initializeComponent<T extends Component = Component>(clazz: IClazz<T>, props?: PickComponentProps<T>) {
  const meta = getMeta(clazz);
  executeCommander(meta, 'initialize');
  components.set(meta, props);
  return new Promise<T>((resolve, reject) => {
    const handler = (e?: any) => {
      meta.off('initialize', handler);
      if (e) return reject(e);
      resolve(meta.instance);
    }
    meta.on('initialize', handler);
  })
}

export function terminateComponent<T extends Component = Component>(clazz: IClazz<T>) {
  const meta = getMeta(clazz);
  if (!components.has(meta)) return Promise.reject(new Error('Component is not exists'));
  executeCommander(meta, 'terminate');
  return new Promise<void>((resolve, reject) => {
    const handler = (e?: any) => {
      meta.off('terminate', handler);
      if (e) return reject(e);
      components.delete(meta);
      resolve();
    }
    meta.on('terminate', handler);
  })
}

export function listen(time: number = 100) {
  const timer = setInterval(() => {
    for (const [meta, props] of components.entries()) {
      if (meta.commander === 'initialize') {
        if (checkInitializable(meta)) {
          meta.initialize(props);
        }
      } else if (meta.commander === 'terminate') {
        if (checkTerminatable(meta)) {
          meta.terminate();
        }
      }
    }
  }, time);
  return () => clearInterval(timer);
}

function executeCommander(meta: Meta, commander: IMetaCommader) {
  meta.commander = commander;
  for (const node of meta.dependents.values()) {
    const nodeMeta = getMeta(node);
    executeCommander(nodeMeta, commander);
  }
}

/**
 * 模块是否允许被初始化
 * @param meta 
 * @returns 
 */
function checkInitializable(meta: Meta): boolean {
  // 只允许当前未被初始化的模块
  if (!!meta.instance) return false;
  // 检查依赖是否全部加载完毕
  for (const node of meta.dependencies.values()) {
    const nodeMeta = getMeta(node);
    // 判断是否为注册的依赖
    if (!components.has(nodeMeta)) return false;
    // 判断依赖是否被初始化
    if (!nodeMeta.instance) return false;
    // 判断依赖是否被安装成功
    if (nodeMeta.instance.__status__ !== 1) return false;
  }
  return true
}

function checkTerminatable(meta: Meta): boolean {
  if (!meta.instance) return false;
  for (const node of meta.dependents.values()) {
    const nodeMeta = getMeta(node);
    if (!components.has(nodeMeta)) return false;
    if (!!nodeMeta.instance) return false;
  }
  return true;
}