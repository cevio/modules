import ioRedis, { type RedisOptions } from 'ioredis';
import { useEffect } from '@evio/visox';
export * from './cache';
export function createIoRedisServer(props: RedisOptions | (() => RedisOptions | Promise<RedisOptions>)) {
  return async () => {
    const redis = new ioRedis(
      typeof props === 'function'
        ? await Promise.resolve(props())
        : props
    );
    await new Promise<void>((resolve, reject) => {
      const onerror = (e: any) => reject(e);
      redis.on('error', onerror);
      redis.on('connect', () => {
        redis.off('error', onerror);
        resolve();
      })
    })
    useEffect(() => redis.disconnect());
    return redis;
  }
}