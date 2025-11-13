// import { betterAuth } from "better-auth";
// import 'dotenv/config';

// // Helper function to encode URL components
// const encodeURIComponentSafe = (str: string): string => {
//   return encodeURIComponent(str).replace(/%/g, '%25');
// };

// // db connection string from env variables
// const getDatabaseUrl = (): string => {
//   // If DATABASE_URL is provided, use it directly
//   if (process.env.DATABASE_URL) {
//     return process.env.DATABASE_URL;
//     console.log("URL"+process.env.DATABASE_URL);
//   }
  
//   const host = process.env.DB_HOST || "";
//   const port = process.env.DB_PORT || "3306";
//   const user = process.env.DB_USER || "";
//   const password = process.env.DB_PASSWORD || "";
//   const dbName = process.env.DB_NAME || "";
  
//   // Encode password to handle special characters
//   const encodedPassword = password ? encodeURIComponentSafe(password) : "";
//   const encodedUser = encodeURIComponentSafe(user);
  
//   // Construct MySQL connection URL: mysql://user:password@host:port/database
//   const url = `mysql://${encodedUser}${password ? `:${encodedPassword}` : ""}@${host}:${port}/${dbName}`;
  
//   return url;
// };

// const databaseUrl = getDatabaseUrl();

// export const auth = betterAuth({
//   database: {
//     provider: "mysql",
//     url: databaseUrl,
//   },
//   emailAndPassword: {
//     enabled: true,
//     requireEmailVerification: false,
//   },
//   baseURL: process.env.BETTER_AUTH_URL || process.env.BASE_URL || "http://localhost:5173",
//   basePath: "/api/auth",
//   secret: process.env.BETTER_AUTH_SECRET || process.env.AUTH_SECRET || "change-this-secret-in-production",
// });
