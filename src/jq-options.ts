export interface JqOptions {
  // filter arguments
  arg?: { [name: string]: string };
  /** @deprecated */
  argfile?: { [name: string]: string };
  argjson?: { [name: string]: string };
  "compact-output"?: boolean;
  // spawn options
  cwd?: string;
  env?: { [key: string]: string | undefined }; // NodeJS.ProcessEnv

  // filter inputs
  filter?: string;
  /** If true, interpret filter as path to filter file */
  "from-file"?: boolean;
  indent?: number;

  // data inputs
  input?: string | string[];
  "join-output"?: boolean;
  /** If true, interpret input as json input */
  jsonInput?: boolean;

  // libs
  "module-dirs"?: string[];
  "raw-input"?: boolean;
  "raw-output"?: boolean;

  // use arg parser
  rawArgs?: string;
  rawfile?: { [name: string]: string };
  slurp?: boolean;
  slurpfile?: { [name: string]: string };
  "sort-keys"?: boolean;

  stream?: boolean;
  tab?: boolean;
}

function mapArgs(options: JqOptions, key: string) {
  const prop = <K extends keyof JqOptions>(
    key: K,
    map: (value: NonNullable<JqOptions[K]>) => string[]
  ) => {
    const value = options[key];
    return value == null ? null : map(value as NonNullable<JqOptions[K]>);
  };
  switch (key) {
    case "module-dirs":
      return prop(key, (moduleDirs) => moduleDirs.flatMap((d) => ["-L", d]));
    case "arg":
      return prop(key, (arg) =>
        Object.entries(arg).flatMap(([key, value]) => ["--arg", key, value])
      );
    case "argjson":
      return prop(key, (argjson) =>
        Object.entries(argjson).flatMap(([key, value]) => [
          "--argjson",
          key,
          value,
        ])
      );
    case "slurpfile":
      return prop(key, (slurpfile) =>
        Object.entries(slurpfile).flatMap(([key, value]) => [
          "--slurpfile",
          key,
          value,
        ])
      );
    case "rawfile":
      return prop(key, (rawfile) =>
        Object.entries(rawfile).flatMap(([key, value]) => [
          "--rawfile",
          key,
          value,
        ])
      );
    case "argfile":
      return prop(key, (argfile) =>
        Object.entries(argfile).flatMap(([key, value]) => [
          "--argfile",
          key,
          value,
        ])
      );
    case "stream":
      return prop(key, () => ["--stream"]);
    case "slurp":
      return prop(key, () => ["--slurp"]);
    case "raw-input":
      return prop(key, () => ["--raw-input"]);
    case "compact-output":
      return prop(key, () => ["--compact-output"]);
    case "tab":
      return prop(key, () => ["--tab"]);
    case "indent":
      return prop(key, (n) => ["--indent", `${n}`]);
    case "sort-keys":
      return prop(key, () => ["--sort-keys"]);
    case "raw-output":
      return prop(key, () => ["--raw-output"]);
    case "join-output":
      return prop(key, () => ["--join-output"]);
    default:
      return null;
  }
}

export const buildJqCommandArgs = (params: JqOptions) => {
  const args: string[] = [];
  for (const key of Object.keys(params)) {
    const value = mapArgs(params, key);
    if (value) {
      args.push(...value);
    }
  }
  if (!params.input) {
    args.push("--null-input");
  }
  if (params["from-file"] && params.filter) {
    args.push("--from-file", params.filter);
  } else if (params.filter) {
    args.push(params.filter);
  } else {
    args.push(".");
  }
  return args;
};
