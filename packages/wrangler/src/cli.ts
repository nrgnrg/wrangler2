import * as Sentry from "@sentry/node";
import process from "process";
import { hideBin } from "yargs/helpers";
import { RewriteFrames } from "@sentry/integrations";

import { main } from ".";
import * as pkj from "../package.json";
import { execaSync } from "execa";
import { sentryCapture } from "./sentry";

Sentry.init({
  release: `${pkj.name}@${pkj.version}`,
  initialScope: {
    tags: { [pkj.name]: pkj.version },
  },
  dsn: "https://87383452498e420ebdb01de6100e44ec@o226679.ingest.sentry.io/6139281",
  tracesSampleRate: 1.0,
  integrations: [
    new RewriteFrames({
      root: "",
      prefix: "/",
    }),
    new Sentry.Integrations.Http({ tracing: true }),
  ],
});
Sentry.setContext("System Information", {
  OS: process.platform,
  node: process.version,
  npm: execaSync("npm", ["--version"]).stdout,
  wrangler: pkj.version,
});

process.on("uncaughtExceptionMonitor", async (err, origin) => {
  await sentryCapture(err, origin);
});

main(hideBin(process.argv)).catch(() => {
  // sentryCapture(err, "mainCatch");
  // The logging of any error that was thrown from `main()` is handled in the `yargs.fail()` handler.
  // Here we just want to ensure that the process exits with a non-zero code.
  // We don't want to do this inside the `main()` function, since that would kill the process when running our tests.
  process.exit(1);
});
