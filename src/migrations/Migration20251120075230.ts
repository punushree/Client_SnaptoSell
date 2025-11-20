import { Migration } from '@mikro-orm/migrations';

export class Migration20251120075230 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table \`product_detection\` add \`average_price\` float null, add \`min_price\` float null, add \`max_price\` float null, add \`price_currency\` varchar(255) null default 'USD', add \`ebay_items_count\` int null, add \`pricing_updated_at\` datetime null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table \`product_detection\` drop column \`average_price\`, drop column \`min_price\`, drop column \`max_price\`, drop column \`price_currency\`, drop column \`ebay_items_count\`, drop column \`pricing_updated_at\`;`);
  }

}
