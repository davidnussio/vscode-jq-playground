import { FetchHttpClient } from "@effect/platform";
import * as Layer from "effect/Layer";
import { logger } from "./adapters/vscode-adapter";
import { InputResolverService } from "./services/input-resolver-service";
import { JqBinaryService } from "./services/jq-binary-service";
import { JqExecutionService } from "./services/jq-execution-service";
import { OutputRendererService } from "./services/output-renderer-service";
import { QueryParserService } from "./services/query-parser-service";
import { SetupLive } from "./setup";

export const AppLive = SetupLive.pipe(
  Layer.provide(JqExecutionService.Default),
  Layer.provide(InputResolverService.Default),
  Layer.provide(QueryParserService.Default),
  Layer.provide(OutputRendererService.Default),
  Layer.provide(JqBinaryService.Default),
  Layer.provide(logger("JQ Playground")),
  Layer.provide(FetchHttpClient.layer)
);
