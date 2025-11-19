import type { ActionFunction, LoaderFunction } from "react-router";
import { auth } from "@/lib/server/auth";

export const loader:LoaderFunction = async ({ request }) => {
  return auth.handler(request);
};

export const action:ActionFunction = async ({ request }) => {
  return auth.handler(request);
};

