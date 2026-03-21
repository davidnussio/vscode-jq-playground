# PROJECT.md — vscode-jq-playground

## Cos'è

Estensione VS Code che integra `jq` (il processore JSON da riga di comando) direttamente nell'editor. Permette di scrivere filtri jq in file `.jqpg`/`.jq`, eseguirli su dati JSON inline, file locali, URL o documenti aperti nel workspace, e visualizzare i risultati nella console di output o in un editor laterale.

## Comandi registrati (package.json → contributes.commands)

| Comando | Titolo | Keybinding | Stato |
|---------|--------|------------|-------|
| `extension.openManual` | JQPG: Manual | — | ✅ Apre URL manuale jq |
| `extension.openTutorial` | JQPG: Tutorial | — | ✅ Apre URL tutorial jq |
| `extension.openExamples` | JQPG: Examples | — | ✅ Apre file esempi nel editor |
| `extension.runQueryOutput` | JQPG: Run query in output | `cmd+enter` | ✅ Esegue query, output in console |
| `extension.runQueryEditor` | JQPG: Run query in editor | `shift+enter` | ✅ Esegue query, output in editor laterale |
| `extension.createJqpgFromFilter` | JQPG: Create playground from filter | — | ❌ `notImplemented` |
| `extension.jqpgFromFilter` | JQPG: Execute jq filter | — | ❌ `notImplemented` |
| `extension.executeJqCommand` | (interno, via CodeLens) | — | ✅ Core execution |

## Configurazione utente

| Setting | Tipo | Default | Descrizione |
|---------|------|---------|-------------|
| `jqPlayground.binaryPath` | string | `""` | Path al binario jq. Se vuoto, tenta auto-detect con `which jq` |

## Linguaggi e grammatiche

- Linguaggio `jqpg` con estensioni `.jqpg`, `.jq`
- Grammatica TextMate: `syntaxes/jq.tmLanguage.json` con embedded `source.jq` e `source.json`
- Dipendenza: `jq-syntax-highlighting.jq-syntax-highlighting`

## Architettura attuale (in mezzo al refactoring Effect)

### Entry point: `src/extension.ts`

```
activate() → launch(MainLive) → Effect.runFork
MainLive = SetupEnvLive + logger + ExtensionConfig + FetchHttpClient
```

### Layer graph

```
MainLive
├── SetupEnvLive (registra comandi, codelens, completion)
├── logger("JQ Playground") → Logger su OutputChannel
├── ExtensionConfig.Default (scoped service: trova/configura jq binary)
└── FetchHttpClient.layer (per fetch URL)
```

### Moduli sorgente

| File | Ruolo | Stato |
|------|-------|-------|
| `src/adapters/vscode-adapter.ts` | Wrapper Effect per API VS Code (comandi, config, eventi, tree, debug) | ✅ Buono, ben strutturato |
| `src/extension-config.ts` | Service `ExtensionConfig`: trova jq binary, verifica versione | ✅ Funzionante ma con problemi (duplica `binaries` da configs.ts, usa `spawnSync` diretto) |
| `src/setup-env.ts` | Layer che registra tutti i comandi, codelens, completion | ✅ Funzionante |
| `src/commands.ts` | Comandi semplici: openManual, openTutorial, openExamples | ✅ Parzialmente migrato a Effect |
| `src/commands/execute-jq-command.ts` | Core: parsing query, risoluzione input, esecuzione jq | ⚠️ Mix di Effect e codice legacy, funzioni morte, nomi italiani/inglesi misti |
| `src/code-lens.ts` | CodeLens provider: trova righe `jq ...` e aggiunge bottoni | ✅ Usa Effect Array/Option |
| `src/lib/command-line.ts` | Parser argomenti jq + `spawnCommandEffect` | ⚠️ `spawnCommandEffect` è Effect ma con API confusa (curried, returns string not typed) |
| `src/renderers.ts` | Output su console o editor laterale | ⚠️ Puro VS Code, non Effect-izzato |
| `src/logger.ts` | Logger output channel | ⚠️ Duplicato: classe Effect `LoggerService` + export globali `Logger`/`Debug` |
| `src/configs.ts` | Costanti (path, titoli, binaries) | ⚠️ Duplica binaries da extension-config.ts |
| `src/builtins.ts` | Dati autocomplete jq builtins | ✅ Dati statici |
| `src/jq-options.ts` | Builder argomenti jq da oggetto opzioni | ✅ Puro, non usato attualmente |
| `src/autocomplete.ts` | Completion provider (vecchio, pre-Effect) | ❌ Non usato, sostituito da setup-env.ts |
| `src/inputbox-filter.ts` | Input box per filtri jq (vecchio) | ❌ Non usato, importa moduli inesistenti |
| `src/messages.ts` | Webview changelog | ❌ Non usato |
| `src/to-migrate/variable-resolver.ts` | Risoluzione variabili `${env:...}` etc. | ❌ Non integrato |
| `src/trash/extension_original.ts` | Vecchia extension pre-Effect | ❌ Archivio |

## Funzionalità core implementate

1. **Auto-detect jq binary**: cerca con `which jq`, propone download o configurazione manuale
2. **CodeLens**: su ogni riga che inizia con `jq `, mostra "⚡ console" e "⚡ editor"
3. **Esecuzione query**: parsing argomenti jq, supporto multiline con apici, redirect output su file (`>`, `>>`)
4. **Input da più sorgenti** (chain con `Effect.firstSuccessOf`):
   - URL (via HttpClient Effect)
   - File aperti nel workspace
   - File locali su disco
   - JSON inline nel documento
5. **Autocomplete**: builtins jq + file aperti nel workspace
6. **Variabili editor**: righe `VAR=value` prima di `jq` vengono lette come variabili

## Problemi principali

- Codice duplicato: `binaries` in `configs.ts` e `extension-config.ts`
- Mix di stili: funzioni con nomi italiani (`gestisciRedirezioneOutput`, `estraiMultilineQuery`) e inglesi
- Moduli morti: `autocomplete.ts`, `inputbox-filter.ts`, `messages.ts`, `trash/`
- `renderers.ts` e `logger.ts` usano API VS Code dirette, non Effect
- `isFilepath` in `execute-jq-command.ts` ritorna `boolean` ma è usato nella chain di Effect processors (type mismatch)
- Nessun error type strutturato (tutto `string` o `Effect.fail("message")`)
- `spawnCommandEffect` è curried in modo confuso e non ha errori tipizzati
- `variable-resolver.ts` non è integrato
- Comandi `createJqpgFromFilter` e `jqpgFromFilter` non implementati
