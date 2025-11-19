import { Entity, type Opt, PrimaryKey, Property } from '@mikro-orm/core';

@Entity()
export class User {

  @PrimaryKey({ type: 'string', length: 36 })
  id!: string;

  @Property({ type: 'text', length: 65535 })
  name!: string;

  @Property({ type: 'string', unique: 'email' })
  email!: string;

  @Property({ fieldName: 'emailVerified', type: 'boolean' })
  emailVerified!: boolean;

  @Property({ type: 'text', length: 65535, nullable: true })
  image?: string;

  @Property({ fieldName: 'createdAt', type: 'datetime', columnType: 'timestamp(3)', defaultRaw: `current_timestamp(3)` })
  createdAt!: Date & Opt;

  @Property({ fieldName: 'updatedAt', type: 'datetime', columnType: 'timestamp(3)', defaultRaw: `current_timestamp(3)` })
  updatedAt!: Date & Opt;

}
