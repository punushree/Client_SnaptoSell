import type { Options } from "@mikro-orm/mysql";
import { EntityGenerator } from "@mikro-orm/entity-generator";
import * as dotenv from "dotenv";
import {
    MySqlDriver,
    ReflectMetadataProvider,
} from "@mikro-orm/mysql";
import { fileURLToPath } from 'url';
import path from 'path';
// Note: User, Session, Account, and Verification entities are managed by BetterAuth
// They are kept in the codebase for reference but not included in MikroORM entities

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ debug: true });

const MikroORMOptions: Options = {
    metadataProvider: ReflectMetadataProvider,
    driver: MySqlDriver,
    dbName: process.env.DB_NAME,
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: Number(process.env.DB_PORT || 3306),
    entities: [path.join(__dirname, '../lib/server/entities')],
    entitiesTs: [path.join(__dirname, '../lib/server/entities')],
    debug: true,
    extensions: [EntityGenerator],
    allowGlobalContext: true,
    dynamicImportProvider: (id) => import(/* @vite-ignore */id),
}

export default MikroORMOptions