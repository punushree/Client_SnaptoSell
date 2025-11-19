import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";
import { reactRouterHonoServer } from "react-router-hono-server/dev"; // add this
import tsconfigPaths from "vite-tsconfig-paths";
import devtoolsJson from "vite-plugin-devtools-json";
// import mkcert from "vite-plugin-mkcert";

export default defineConfig({
  plugins: [
    devtoolsJson(),
    reactRouterHonoServer(),
    reactRouter(),
    tsconfigPaths(),
    // mkcert(),
  ],
});
