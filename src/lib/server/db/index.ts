import { MikroORM } from '@mikro-orm/core';
import type { MySqlDriver } from '@mikro-orm/mysql';
import MikroORMOptions from '@/config/mikro-orm';

type OrmType = MikroORM<MySqlDriver>;

declare global {
  var __orm: OrmType | undefined;
}

export async function getOrm(): Promise<OrmType> {
  if (globalThis.__orm) {
    return globalThis.__orm;
  }

  const orm = await MikroORM.init<MySqlDriver>(MikroORMOptions);

  if (process.env.NODE_ENV === 'production') {
    globalThis.__orm = orm;
  } else {
    globalThis.__orm = orm; 
  }
  
  return orm;
}