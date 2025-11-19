import { Entity, type Opt, PrimaryKey, Property } from '@mikro-orm/core';

@Entity()
export class Account {

  @PrimaryKey({ type: 'string', length: 36 })
  id!: string;

  @Property({ fieldName: 'accountId', type: 'text', length: 65535 })
  accountId!: string;

  @Property({ fieldName: 'providerId', type: 'text', length: 65535 })
  providerId!: string;

  @Property({ fieldName: 'userId',type: 'string', length: 36 })
  userId!: string;

  @Property({ fieldName: 'accessToken', type: 'text', length: 65535, nullable: true })
  accessToken?: string;

  @Property({ fieldName: 'refreshToken', type: 'text', length: 65535, nullable: true })
  refreshToken?: string;

  @Property({ fieldName: 'idToken', type: 'text', length: 65535, nullable: true })
  idToken?: string;

  @Property({ fieldName: 'accessTokenExpiresAt', type: 'datetime', columnType: 'timestamp(3)', nullable: true })
  accessTokenExpiresAt?: Date;

  @Property({ fieldName: 'refreshTokenExpiresAt', type: 'datetime', columnType: 'timestamp(3)', nullable: true })
  refreshTokenExpiresAt?: Date;

  @Property({ type: 'text', length: 65535, nullable: true })
  scope?: string;

  @Property({ type: 'text', length: 65535, nullable: true })
  password?: string;

  @Property({ fieldName: 'createdAt', type: 'datetime', columnType: 'timestamp(3)', defaultRaw: `current_timestamp(3)` })
  createdAt!: Date & Opt;

  @Property({ fieldName: 'updatedAt', type: 'datetime', columnType: 'timestamp(3)' })
  updatedAt!: Date;

}
