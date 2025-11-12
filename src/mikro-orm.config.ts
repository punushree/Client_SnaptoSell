import {
  defineConfig,
} from "@mikro-orm/mysql";
import MikroORMOptions from "./config/mikro-orm.ts";

export default defineConfig(MikroORMOptions);
