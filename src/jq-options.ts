export interface JqOptions {
  // spawn options
  cwd?: string;
  env?: { [key: string]: string | undefined }; // NodeJS.ProcessEnv

  // use arg parser
  rawArgs?: string;

  // data inputs
  input?: string | string[];
  /** If true, interpret input as json input */
  jsonInput?: boolean;

  // filter inputs
  filter?: string;
  /** If true, interpret filter as path to filter file */
  "from-file"?: boolean;

  // libs
  "module-dirs"?: string[];

  // filter arguments
  arg?: { [name: string]: string };
  argjson?: { [name: string]: string };
  slurpfile?: { [name: string]: string };
  rawfile?: { [name: string]: string };
  /** @deprecated */
  argfile?: { [name: string]: string };

  stream?: boolean;
  slurp?: boolean;
  "raw-input"?: boolean;
  "compact-output"?: boolean;
  tab?: boolean;
  indent?: number;
  "sort-keys"?: boolean;
  "raw-output"?: boolean;
  "join-output"?: boolean;
}

function mapArgs(options: JqOptions, key: string) {
  const prop = <K extends keyof JqOptions>(
    k: K,
    mapFn: (value: Exclude<JqOptions[K], undefined>) => string[]
  ) => {
    const value = options[k];
    return value !== undefined ? mapFn(value as any) : null;
  };

  switch (key) {
    case "module-dirs":
      return prop("module-dirs", (moduleDirs) =>
        moduleDirs.flatMap((d) => ["-L", d])
      );
    case "arg":
      return prop("arg", (arg) =>
        Object.entries(arg).flatMap(([k, v]) => ["--arg", k, v])
      );
    case "argjson":
      return prop("argjson", (argjson) =>
        Object.entries(argjson).flatMap(([k, v]) => ["--argjson", k, v])
      );
    case "slurpfile":
      return prop("slurpfile", (slurpfile) =>
        Object.entries(slurpfile).flatMap(([k, v]) => ["--slurpfile", k, v])
      );
    case "rawfile":
      return prop("rawfile", (rawfile) =>
        Object.entries(rawfile).flatMap(([k, v]) => ["--rawfile", k, v])
      );
    case "argfile":
      return prop("argfile", (argfile) =>
        Object.entries(argfile).flatMap(([k, v]) => ["--argfile", k, v])
      );
    case "stream":
      return prop("stream", () => ["--stream"]);
    case "slurp":
      return prop("slurp", () => ["--slurp"]);
    case "raw-input":
      return prop("raw-input", () => ["--raw-input"]);
    case "compact-output":
      return prop("compact-output", () => ["--compact-output"]);
    case "tab":
      return prop("tab", () => ["--tab"]);
    case "indent":
      return prop("indent", (n) => ["--indent", `${n}`]);
    case "sort-keys":
      return prop("sort-keys", () => ["--sort-keys"]);
    case "raw-output":
      return prop("raw-output", () => ["--raw-output"]);
    case "join-output":
      return prop("join-output", () => ["--join-output"]);
    default:
      return null;
  }
}

export const buildJqCommandArgs = (params: JqOptions) => {
  const args = [];
  for (const key of Object.keys(params)) {
    const value = mapArgs(params, key);
    if (value) {
      args.push(...value);
    }
  }
  if (!params.input) {
    args.push("--null-input");
  }
  if (params["from-file"]) {
    args.push("--from-file", params.filter);
  } else if (params.filter) {
    args.push(params.filter);
  } else {
    args.push(".");
  }
  return args;
};
