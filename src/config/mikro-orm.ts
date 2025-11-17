import type { Options } from "@mikro-orm/mysql";
import { EntityGenerator } from "@mikro-orm/entity-generator";
import * as dotenv from "dotenv";
import {
    MySqlDriver,
    ReflectMetadataProvider,
} from "@mikro-orm/mysql";
import { ProductDetection } from "../lib/server/entities/product-detection.entity";

dotenv.config({ debug: true });

const MikroORMOptions: Options = {
    metadataProvider: ReflectMetadataProvider,
    driver: MySqlDriver,
    dbName: process.env.DB_NAME,
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: Number(process.env.DB_PORT || 3306),
    entities: [ProductDetection],
    debug: true,
    extensions: [EntityGenerator],
    allowGlobalContext: true,
    dynamicImportProvider: (id) => import(/* @vite-ignore */id),
}

export default MikroORMOptions