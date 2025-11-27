import type { Options } from "@mikro-orm/mysql";
import { EntityGenerator } from "@mikro-orm/entity-generator";
import {
    MySqlDriver,
    ReflectMetadataProvider,
} from "@mikro-orm/mysql";
import dotenv from "dotenv"

import { Account } from "@/lib/server/entities/Account";
import { ProductDetection } from "@/lib/server/entities/ProductDetection";
import { User } from "@/lib/server/entities/User";
import { Session } from "@/lib/server/entities/Session";
import { Verification } from "@/lib/server/entities/Verification";

// const isMikroOrmCommand = () => {
//     const args = process.argv;
//     return args.some(arg => arg.includes('mikro-orm'));
// };

// if (isMikroOrmCommand()) {
//     if (typeof window === 'undefined') {
//         const dotenv = (await import('dotenv'));
//         dotenv.config({ debug: true });
//     }
// }

dotenv.config({ debug: true });

const ENTITIES: Options['entities'] = [Account, ProductDetection, Session, User, Verification];

const MikroORMOptions: Options = {
    metadataProvider: ReflectMetadataProvider,
    driver: MySqlDriver,
    dbName: process.env.DB_NAME,
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: Number(process.env.DB_PORT || 3306),
    entities: ENTITIES,
    // entities: ['./src/lib/server/entities'],
    debug: true,
    extensions: [EntityGenerator],
    allowGlobalContext: true,
    dynamicImportProvider: (id) => import(/* @vite-ignore */id),
};

export default MikroORMOptions;