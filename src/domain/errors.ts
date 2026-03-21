import * as Schema from "effect/Schema";

export class JqBinaryNotFoundError extends Schema.TaggedError<JqBinaryNotFoundError>()(
  "JqBinaryNotFoundError",
  { message: Schema.String }
) {}

export class JqExecutionError extends Schema.TaggedError<JqExecutionError>()(
  "JqExecutionError",
  {
    message: Schema.String,
    command: Schema.String,
    args: Schema.Array(Schema.String),
  }
) {}

export class JqParseError extends Schema.TaggedError<JqParseError>()(
  "JqParseError",
  { message: Schema.String }
) {}

export class InvalidJsonInputError extends Schema.TaggedError<InvalidJsonInputError>()(
  "InvalidJsonInputError",
  { message: Schema.String }
) {}

export class FileNotFoundError extends Schema.TaggedError<FileNotFoundError>()(
  "FileNotFoundError",
  { path: Schema.String, message: Schema.String }
) {}

export class UnsupportedPlatformError extends Schema.TaggedError<UnsupportedPlatformError>()(
  "UnsupportedPlatformError",
  { platform: Schema.String, arch: Schema.String, message: Schema.String }
) {}

export class CommandTimeoutError extends Schema.TaggedError<CommandTimeoutError>()(
  "CommandTimeoutError",
  { message: Schema.String, timeoutMs: Schema.Number }
) {}

export class ConfigurationError extends Schema.TaggedError<ConfigurationError>()(
  "ConfigurationError",
  { message: Schema.String }
) {}

export class InputResolutionError extends Schema.TaggedError<InputResolutionError>()(
  "InputResolutionError",
  { message: Schema.String }
) {}
