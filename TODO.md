# TODO — vscode-jq-playground

---

## Refactoring Effect-TS

### Fase 0 — Pulizia e preparazione

- [x] 0.1 Eliminare file morti: `autocomplete.ts`, `inputbox-filter.ts`, `messages.ts`, `trash/`
- [x] 0.2 Eliminare `configs.ts` (duplicato)
- [x] 0.3 Eliminare `logger.ts` (duplicato, il logger è in vscode-adapter)
- [x] 0.4 Rinominare funzioni italiane in inglese
- [x] 0.5 Verificare che il progetto compili dopo la pulizia

### Fase 1 — Schema e tipi di dominio (`src/domain/`)

- [x] 1.1 `errors.ts` — Errori tipizzati con `Schema.TaggedError`
- [x] 1.2 `models.ts` — Branded types, OutputTarget, InputSource, ParsedQuery
- [x] 1.3 `constants.ts` — Costanti (binaries per piattaforma, regex, lingue)

### Fase 2 — Services (`src/services/`)

- [x] 2.1 `JqBinaryService` — find, version, validate, download, config
- [x] 2.2 `JqExecutionService` — execute con spawn, timeout, errori tipizzati
- [x] 2.3 `InputResolverService` — chain: URL → workspace doc → shell → file → inline JSON
- [x] 2.4 `QueryParserService` — parsing args, multiline, redirect, variabili
- [x] 2.5 `OutputRendererService` — console, editor, file, file append

### Fase 3 — Comandi e UI

- [x] 3.1 `execute-query.ts` — Comando principale con composizione service
- [x] 3.2 `open-resources.ts` — Manual, Tutorial, Examples
- [x] 3.3 `playground.ts` — createJqpgFromFilter, executeJqFromFilter
- [x] 3.4 `code-lens.ts` — CodeLens provider con supporto AI
- [x] 3.5 `completion.ts` — Autocomplete builtins + workspace files

### Fase 4 — Layer composition e entry point

- [x] 4.1 `layers.ts` — AppLive con tutti i service
- [x] 4.2 `extension.ts` — Entry point pulito con launch + Effect.runFork
- [x] 4.3 `setup.ts` — Registrazione comandi, codelens, completion, chat participant

### Fase 5 — Funzionalità mancanti dal refactoring

- [x] 5.1 Implementare `createJqpgFromFilter`
- [x] 5.2 Implementare `jqpgFromFilter`
- [ ] 5.3 Integrare `variable-resolver.ts` come service Effect (`${env:...}`, `${config:...}`)
- [x] 5.4 Validazione JSON input prima dell'esecuzione (in JqExecutionService)
- [ ] 5.5 Hover documentation per builtins jq

### Fase 6 — Testing

- [ ] 6.1 Setup `@effect/vitest` (rinominare `vitest.config.ts_` → `vitest.config.ts`)
- [ ] 6.2 Test `QueryParserService`: parsing argomenti, multiline, redirect
- [ ] 6.3 Test `JqExecutionService`: esecuzione, timeout, errori
- [ ] 6.4 Test `InputResolverService`: chain di processor
- [ ] 6.5 Test `command-line.ts`: `parseJqCommandArgs` (test esistente da migrare)

---

## Consolidamento

- [ ] Verificare che il path jq configurato punti effettivamente a jq e non a un altro eseguibile
- [ ] Hover provider per builtins jq (documentazione al passaggio del mouse)
- [ ] Snippet library: filtri jq comuni (flatten, group-by, unique, select-where) inseribili da autocomplete
- [ ] Migliorare autocomplete: context-aware in base alla posizione nel filtro

---

## Nuove funzionalità — Esperienza utente

- [ ] Tree View risultati: pannello laterale con JSON navigabile (expand/collapse)
- [ ] Query history: ultime N query eseguite con risultati, navigabili da command palette
- [ ] Live preview / watch mode: riesecuzione automatica al cambio filtro o input (debounced)
- [ ] Multi-file batch processing: stesso filtro su più file JSON, output aggregato o per-file
- [ ] Diff view: confronto risultati di due filtri diversi o stesso filtro su input diversi
- [ ] Copy result to clipboard: comando dedicato per copiare l'ultimo risultato
- [ ] Execution time metrics: mostrare tempo di esecuzione nella status bar

---

## Nuove funzionalità — Avanzate

- [ ] jq debugger step-by-step: visualizzare output intermedio di ogni stage della pipeline
- [ ] Notebook API nativa: migrare da `.jqpg` alla VS Code Notebook API (celle con output renderizzato)
- [ ] Export/share playground: esportare come gist GitHub, markdown, o link condivisibile
- [ ] jq module support: supporto `import`/`include` con autocomplete e go-to-definition
- [ ] Schema inference: analizzare JSON input e suggerire filtri basati sulla struttura
- [ ] Reusable filter templates: libreria di filtri salvabili e riutilizzabili per progetto

---

## Ecosistema

- [ ] Web extension: compatibilità con vscode.dev usando WASM build di jq
- [ ] Supporto yq/xq: estendere il playground per YAML (yq) e XML (xq)
- [ ] Marketplace filtri: repository community di filtri jq scaricabili

---

## Struttura target

```
src/
├── domain/
│   ├── errors.ts
│   ├── models.ts
│   └── constants.ts
├── services/
│   ├── jq-binary-service.ts
│   ├── jq-execution-service.ts
│   ├── input-resolver-service.ts
│   ├── query-parser-service.ts
│   └── output-renderer-service.ts
├── commands/
│   ├── execute-query.ts
│   ├── open-resources.ts
│   └── playground.ts
├── providers/
│   ├── code-lens.ts
│   └── completion.ts
├── ai/
│   ├── ai-service.ts
│   ├── ai-commands.ts
│   ├── chat-participant.ts
│   └── prompts.ts
├── adapters/
│   └── vscode-adapter.ts
├── lib/
│   └── command-line.ts
├── layers.ts
├── setup.ts
└── extension.ts
```
