import { Entity, type Opt, PrimaryKey, Property } from '@mikro-orm/core';

@Entity()
export class Session {

  @PrimaryKey({ type: 'string', length: 36 })
  id!: string;

  @Property({ fieldName: 'expiresAt', type: 'datetime', columnType: 'timestamp(3)' })
  expiresAt!: Date;

  @Property({ type: 'string', unique: 'token' })
  token!: string;

  @Property({ fieldName: 'createdAt', type: 'datetime', columnType: 'timestamp(3)', defaultRaw: `current_timestamp(3)` })
  createdAt!: Date & Opt;

  @Property({ fieldName: 'updatedAt', type: 'datetime', columnType: 'timestamp(3)' })
  updatedAt!: Date;

  @Property({ fieldName: 'ipAddress', type: 'text', length: 65535, nullable: true })
  ipAddress?: string;

  @Property({ fieldName: 'userAgent', type: 'text', length: 65535, nullable: true })
  userAgent?: string;

  @Property({ fieldName: 'userId', type: 'string', length: 36 })
  userId!: string;

}
