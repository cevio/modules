import { useEffect } from '@evio/visox';
import { DataSource, type DataSourceOptions, type QueryRunner } from 'typeorm';

export function createTypeORMServer(props: DataSourceOptions) {
  return async () => {
    const connection = new DataSource(props)
    await connection.initialize();
    useEffect(() => connection.destroy());
    return connection;
  }
}

export async function useTransaction<T>(datasource: DataSource, callback: (
  runner: QueryRunner,
  rollback: (roll: () => unknown | Promise<unknown>) => number
) => Promise<T>) {
  const rollbacks: (() => unknown | Promise<unknown>)[] = [];
  const runner = datasource.createQueryRunner();
  await runner.connect();
  await runner.startTransaction();
  const push = (roll: () => unknown | Promise<unknown>) => rollbacks.push(roll);
  try {
    const res = await callback(runner, push);
    await runner.commitTransaction();
    return res;
  } catch (e) {
    await runner.rollbackTransaction();
    let i = rollbacks.length;
    while (i--) await Promise.resolve(rollbacks[i]());
    throw e;
  } finally {
    await runner.release();
  }
}