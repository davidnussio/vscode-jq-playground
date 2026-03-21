import { FetchHttpClient } from '@effect/platform';
import * as Layer from 'effect/Layer';
import { logger } from './adapters/vscode-adapter';
import { InputResolverService } from './services/InputResolverService';
import { JqBinaryService } from './services/JqBinaryService';
import { JqExecutionService } from './services/JqExecutionService';
import { OutputRendererService } from './services/OutputRendererService';
import { QueryParserService } from './services/QueryParserService';
import { SetupLive } from './setup';

export const AppLive = SetupLive.pipe(
  Layer.provide(JqExecutionService.Default),
  Layer.provide(InputResolverService.Default),
  Layer.provide(QueryParserService.Default),
  Layer.provide(OutputRendererService.Default),
  Layer.provide(JqBinaryService.Default),
  Layer.provide(logger('JQ Playground')),
  Layer.provide(FetchHttpClient.layer)
);
