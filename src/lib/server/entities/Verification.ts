import { Entity, type Opt, PrimaryKey, Property } from '@mikro-orm/core';

@Entity()
export class Verification {

  @PrimaryKey({ type: 'string', length: 36 })
  id!: string;

  @Property({ type: 'text', length: 65535 })
  identifier!: string;

  @Property({ type: 'text', length: 65535 })
  value!: string;

  @Property({ fieldName: 'expiresAt', type: 'datetime', columnType: 'timestamp(3)' })
  expiresAt!: Date;

  @Property({ fieldName: 'createdAt', type: 'datetime', columnType: 'timestamp(3)', defaultRaw: `current_timestamp(3)` })
  createdAt!: Date & Opt;

  @Property({ fieldName: 'updatedAt', type: 'datetime', columnType: 'timestamp(3)', defaultRaw: `current_timestamp(3)` })
  updatedAt!: Date & Opt;

}
