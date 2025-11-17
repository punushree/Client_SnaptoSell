import { Migration } from '@mikro-orm/migrations';

export class Migration20251117141605 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table \`product_detection\` add \`user_confirmed\` tinyint(1) not null default false, add \`confirmed_at\` datetime null;`);
    this.addSql(`alter table \`product_detection\` modify \`created_at\` datetime not null default CURRENT_TIMESTAMP, modify \`updated_at\` datetime not null default CURRENT_TIMESTAMP;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table \`product_detection\` drop column \`user_confirmed\`, drop column \`confirmed_at\`;`);

    this.addSql(`alter table \`product_detection\` modify \`created_at\` timestamp null default CURRENT_TIMESTAMP, modify \`updated_at\` timestamp null default CURRENT_TIMESTAMP on update CURRENT_TIMESTAMP;`);
  }

}
