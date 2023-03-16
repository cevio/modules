import KFMW, { IRequest as IKFMWRequest, IResponse, IClazz, Route, Meta } from '@evio/kfmw-workflow';
import { Component, Module, IComponentSetupReturnType } from '@evio/moduare';
import { Server as WebSocket } from "socket.io";

export interface IRequest extends IKFMWRequest {
  socketable?: boolean,
  initialize?: () => IComponentSetupReturnType | Promise<IComponentSetupReturnType>;
}

@Module()
export default class KoaFindMyWayWorkflowModuareServer extends Component<IRequest> {
  public koa: IResponse['koa'];
  public server: IResponse['server'];
  public application: IResponse['fmw'];
  public webSocket: WebSocket;

  /**
   * 创建websocket对象
   * @returns 
   */
  private createWebsocket() {
    const node = KFMW.hook('listen');
    node.before('websocket', obj => {
      this.webSocket = new WebSocket(obj.server);
    })
    return () => node.delete('websocket');
  }

  public async setup() {
    let rollbacks: (() => void | Promise<void>)[] = [];
    const { socketable, initialize, ...options } = this.props;
    if (socketable) rollbacks.push(this.createWebsocket());
    if (typeof initialize === 'function') {
      const terminate = await Promise.resolve(initialize());
      if (typeof terminate === 'function') {
        rollbacks.push(terminate);
      }
    }
    const { koa, fmw, server } = await KFMW.create(options);
    this.koa = koa;
    this.server = server;
    this.application = fmw;
    return async () => {
      this.server.close();
      let i = rollbacks.length;
      while (i--) {
        const rollback = rollbacks[i];
        await Promise.resolve(rollback());
      }
    }
  }

  /**
   * 添加路由
   * @param clazz 
   * @returns 
   */
  public addController<T extends Route = Route>(clazz: IClazz<T>) {
    if (!this.koa || !this.server || !this.application) {
      throw new Error('KoaFindMyWayWorkflowModuareServer is not ready.');
    }
    Meta.get(clazz).mount(this.application);
    return this;
  }

  /**
   * 卸载路由
   * @param clazz 
   * @returns 
   */
  public delController<T extends Route = Route>(clazz: IClazz<T>) {
    if (!this.koa || !this.server || !this.application) {
      throw new Error('KoaFindMyWayWorkflowModuareServer is not ready.');
    }
    Meta.get(clazz).unmount(this.application);
    return this;
  }
}