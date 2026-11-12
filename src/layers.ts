import * as FetchHttpClient from "effect/http/FetchHttpClient";
import * as Layer from "effect/Layer";
import { logger } from "./adapters/vscode-adapter";
import { AiService } from "./ai/ai-service";
import { InputResolverService } from "./services/input-resolver-service";
import { JqBinaryService } from "./services/jq-binary-service";
import { JqExecutionService } from "./services/jq-execution-service";
import { OutputRendererService } from "./services/output-renderer-service";
import { QueryParserService } from "./services/query-parser-service";
import { SetupLive } from "./setup";

export const AppLive = SetupLive.pipe(
  Layer.provide(JqExecutionService.layer),
  Layer.provide(InputResolverService.layer),
  Layer.provide(QueryParserService.layer),
  Layer.provide(OutputRendererService.layer),
  Layer.provide(JqBinaryService.layer),
  Layer.provide(AiService.layer),
  Layer.provide(logger("JQ Playground")),
  Layer.provide(FetchHttpClient.layer)
);
