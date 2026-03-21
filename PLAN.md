# PLAN.md — Ristrutturazione completa con Effect-TS

Obiettivo: ricreare il progetto in modo strutturato con Schema, errori tipizzati, Service/Layer e implementazioni pulite.

---

## Fase 0 — Pulizia e preparazione

- [x] 0.1 Eliminare file morti: `src/autocomplete.ts`, `src/inputbox-filter.ts`, `src/messages.ts`, `src/trash/`
- [x] 0.2 Eliminare `src/configs.ts` (duplicato, verrà sostituito)
- [x] 0.3 Eliminare `src/logger.ts` (duplicato, il logger è già in vscode-adapter)
- [x] 0.4 Rinominare funzioni italiane in inglese in `execute-jq-command.ts`
- [x] 0.5 Verificare che il progetto compili dopo la pulizia

---

## Fase 1 — Schema e tipi di dominio (`src/domain/`)

Definire tutti i tipi con `Schema.Class`, branded types e `Schema.TaggedErrorClass`.

- [ ] 1.1 `src/domain/errors.ts` — Errori tipizzati:
  ```
  JqBinaryNotFoundError    — jq non trovato nel sistema
  JqExecutionError         — errore durante esecuzione jq
  JqParseError             — errore parsing argomenti/query
  InvalidJsonInputError    — input JSON non valido
  FileNotFoundError        — file di input non trovato
  UnsupportedPlatformError — piattaforma/architettura non supportata
  CommandTimeoutError      — timeout esecuzione comando
  ConfigurationError       — errore configurazione
  ```

- [ ] 1.2 `src/domain/models.ts` — Modelli di dominio:
  ```
  JqBinaryPath     — branded string per path al binario jq
  JqFilter         — branded string per filtro jq
  JqVersion        — branded string per versione jq
  JqCommandArgs    — schema per argomenti comando jq
  PlatformBinary   — schema per binario specifico per piattaforma
  QueryResult      — risultato esecuzione query
  InputSource      — union: UrlInput | FileInput | WorkspaceDocInput | InlineJsonInput
  OutputTarget     — union: ConsoleOutput | EditorOutput | FileOutput | FileAppendOutput
  ```

- [ ] 1.3 `src/domain/constants.ts` — Costanti (binaries per piattaforma, regex, titoli CodeLens)

---

## Fase 2 — Services (`src/services/`)

Ogni service come `Effect.Service` con layer, errori tipizzati e metodi `Effect.fn`.

- [ ] 2.1 `src/services/JqBinaryService.ts` — Gestione binario jq:
  ```
  find()     → Effect<JqBinaryPath, JqBinaryNotFoundError>
  version()  → Effect<JqVersion, JqExecutionError>
  validate() → Effect<{ path, version }, JqBinaryNotFoundError | JqExecutionError>
  ```
  Layer: legge config, fallback su `which jq`, verifica versione.

- [ ] 2.2 `src/services/JqExecutionService.ts` — Esecuzione comandi jq:
  ```
  execute(args, input, options) → Effect<string, JqExecutionError | CommandTimeoutError>
  ```
  Layer: dipende da `JqBinaryService`. Wrappa `spawn` con Effect, timeout, errori tipizzati.

- [ ] 2.3 `src/services/InputResolverService.ts` — Risoluzione input da sorgenti diverse:
  ```
  resolve(document, line) → Effect<{ data: string, source: InputSource }, FileNotFoundError | ...>
  ```
  Chain di processor: URL → workspace doc → file locale → inline JSON.
  Layer: dipende da `HttpClient`.

- [ ] 2.4 `src/services/QueryParserService.ts` — Parsing query jq dal documento:
  ```
  parse(document, line) → Effect<{ args, filter, outputTarget, inputLine }, JqParseError>
  ```
  Estrae: argomenti, filtro (anche multiline), redirect output, variabili.

- [ ] 2.5 `src/services/OutputRendererService.ts` — Rendering risultati:
  ```
  render(result, target) → Effect<void>
  ```
  Gestisce: console output, editor laterale, file, file append. Wrappato in Effect.

---

## Fase 3 — Comandi e UI (`src/commands/`, `src/providers/`)

- [ ] 3.1 `src/commands/execute-query.ts` — Comando principale (refactor di `executeJqCommand`):
  Compone: QueryParser → InputResolver → JqExecution → OutputRenderer.
  Tutto tipizzato, nessun `any`, errori gestiti con `catchTags`.

- [ ] 3.2 `src/commands/open-resources.ts` — Comandi openManual, openTutorial, openExamples

- [ ] 3.3 `src/commands/playground.ts` — Implementare `createJqpgFromFilter` e `jqpgFromFilter`:
  - Input box per filtro
  - Crea documento `.jqpg` con filtro e JSON selezionato
  - Esegue filtro su JSON dell'editor attivo

- [ ] 3.4 `src/providers/code-lens.ts` — CodeLens provider (refactor minimo, già buono)

- [ ] 3.5 `src/providers/completion.ts` — Completion provider (unifica da setup-env.ts)

---

## Fase 4 — Layer composition e entry point

- [ ] 4.1 `src/layers.ts` — Composizione layer:
  ```
  AppLive = JqBinaryService.layer
    |> InputResolverService.layer
    |> JqExecutionService.layer
    |> QueryParserService.layer
    |> OutputRendererService.layer
    |> CommandsLayer
    |> ProvidersLayer
    |> provide(ExtensionConfig)
    |> provide(FetchHttpClient)
    |> provide(logger)
  ```

- [ ] 4.2 `src/extension.ts` — Entry point pulito:
  ```typescript
  export const activate = (context) =>
    launch(AppLive).pipe(
      Effect.provideService(VsCodeContext, context),
      Effect.runFork
    )
  ```

- [ ] 4.3 `src/setup.ts` — Registrazione comandi/provider (refactor di setup-env.ts)

---

## Fase 5 — Funzionalità mancanti

- [x] 5.1 Implementare `createJqpgFromFilter`
- [x] 5.2 Implementare `jqpgFromFilter`
- [ ] 5.3 Integrare `variable-resolver.ts` come service Effect
- [ ] 5.4 Aggiungere validazione JSON input prima dell'esecuzione
- [ ] 5.5 Hover documentation per builtins jq

---

## Fase 6 — Testing

- [ ] 6.1 Setup `@effect/vitest` (rinominare `vitest.config.ts_` → `vitest.config.ts`)
- [ ] 6.2 Test `QueryParserService`: parsing argomenti, multiline, redirect
- [ ] 6.3 Test `JqExecutionService`: esecuzione, timeout, errori
- [ ] 6.4 Test `InputResolverService`: chain di processor
- [ ] 6.5 Test `command-line.ts`: `parseJqCommandArgs` (test esistente da migrare)

---

## Struttura target

```
src/
├── domain/
│   ├── errors.ts          # Schema.TaggedErrorClass per tutti gli errori
│   ├── models.ts          # Schema.Class, branded types, union types
│   └── constants.ts       # Costanti (binaries, regex, titoli)
├── services/
│   ├── JqBinaryService.ts
│   ├── JqExecutionService.ts
│   ├── InputResolverService.ts
│   ├── QueryParserService.ts
│   └── OutputRendererService.ts
├── commands/
│   ├── execute-query.ts
│   ├── open-resources.ts
│   └── playground.ts
├── providers/
│   ├── code-lens.ts
│   └── completion.ts
├── adapters/
│   └── vscode-adapter.ts  # Invariato (già ben fatto)
├── lib/
│   └── command-line.ts    # Parser args (refactor minimo)
├── layers.ts              # Composizione layer
├── setup.ts               # Registrazione comandi/provider
└── extension.ts           # Entry point
```

---

## Ordine di esecuzione consigliato

1. **Fase 0** → pulisci il terreno
2. **Fase 1** → definisci i tipi (fondamenta)
3. **Fase 2** → implementa i service uno alla volta, testando ciascuno
4. **Fase 3** → ricollega comandi e UI ai nuovi service
5. **Fase 4** → componi i layer e verifica che l'estensione si attivi
6. **Fase 5** → aggiungi funzionalità mancanti
7. **Fase 6** → test

Ogni fase è indipendente e verificabile. Non procedere alla fase successiva finché la corrente non compila e funziona.
