import { Entity, PrimaryKey, Property, ManyToOne } from "@mikro-orm/core";
import { User } from "./user.entity.js";

@Entity({ tableName: 'session' })
export class Session {
  @PrimaryKey({ type: 'varchar', length: 255 })
  id!: string;

  @Property({ type: 'varchar', length: 36 })
  userId!: string;

  @Property({ type: 'datetime' })
  expiresAt!: Date;

  @Property({ type: 'varchar', length: 255, nullable: true })
  token?: string;

  @Property({ type: 'varchar', length: 255, nullable: true })
  ipAddress?: string;

  @Property({ type: 'text', nullable: true })
  userAgent?: string;

  @Property({ type: 'datetime', defaultRaw: 'CURRENT_TIMESTAMP', onCreate: () => new Date() })
  createdAt: Date = new Date();

  @Property({ type: 'datetime', defaultRaw: 'CURRENT_TIMESTAMP', onUpdate: () => new Date() })
  updatedAt: Date = new Date();

  @ManyToOne(() => User)
  user!: User;
}

