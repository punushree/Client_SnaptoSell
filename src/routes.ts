import { type RouteConfig } from "@react-router/dev/routes";
import { nextRoutes, type Options } from "rr-next-routes/react-router";

export const pageRouterStyle: Options = {
  folderName: "pages",
  print: "no",
  layoutFileName: "_layout",
  routeFileNames: ["page"],
  extensions: [".tsx",".ts"],
  routeFileNameOnly: false,
};

const routes = nextRoutes(pageRouterStyle);

export default routes satisfies RouteConfig;
