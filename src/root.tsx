import "@mantine/core/styles.css";
import "@mantine/nprogress/styles.css";
import "@mantine/notifications/styles.css";
import "@/styles/globals.css";

import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useFetchers,
  useNavigation,
  type MetaArgs,
} from "react-router";
import {
  ColorSchemeScript,
  MantineProvider,
  mantineHtmlProps,
} from "@mantine/core";
import { ModalsProvider } from "@mantine/modals";
import { Notifications } from "@mantine/notifications";

import type { Route } from "./+types/root";
import { NavigationProgress, nprogress } from "@mantine/nprogress";
import { useEffect } from "react";
import NotFoundPage from "@/pages/404/page";

export function meta({}: MetaArgs) {
  return [
    { title: "SnapToSell - Never Get Scammed on Marketplace Again" },
    {
      name: "description",
      content:
        "AI-powered fraud detection meets instant item pricing. Sell safely, sell smarter, sell faster.",
    },
    { name: "robots", content: "noindex, nofollow" },
  ];
}

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" {...mantineHtmlProps}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <ColorSchemeScript />
        <Meta />
        <Links />
      </head>
      <body>
        <MantineProvider defaultColorScheme="light">
          <NavigationProgress />
          <Notifications />
          <ModalsProvider>{children}</ModalsProvider>
        </MantineProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  if (isRouteErrorResponse(error) && error.status === 404) {
    return <NotFoundPage />;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}

export default function App() {
  const navigation = useNavigation();
  const fetchers = useFetchers();
  useEffect(() => {
    const fetchersIdle = fetchers.every((f) => f.state === "idle");
    if (navigation.state === "idle" && fetchersIdle) {
      nprogress.complete();
    } else {
      nprogress.start();
    }
  }, [navigation.state, fetchers]);
  return <Outlet />;
}
