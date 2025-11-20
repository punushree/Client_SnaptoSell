import { Migration } from '@mikro-orm/migrations';

export class Migration20251120061452 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table \`product_detection\` modify \`userId\` varchar(36) null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table \`product_detection\` modify \`userId\` varchar(255) not null;`);
  }

}
