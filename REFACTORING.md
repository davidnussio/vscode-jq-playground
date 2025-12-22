# Refactoring Status

## Directory Structure

The project has been refactored into a cleaner directory structure:

- `src/adapters/`: Adapters for VS Code API (Effect wrappers).
- `src/commands/`: Command implementations (general, inputbox filter, execute jq).
- `src/config/`: Configuration handling (`configs.ts`, `extension-config.ts`).
- `src/constants/`: Constants (messages, etc.).
- `src/services/`: Core services (Variable Resolver).
- `src/utils/`: Utility functions (logger, renderers, command line, jq options).

## Migrated Components

### Variable Resolver

- **Status**: Migrated to `src/services/variable-resolver.ts`.
- **Changes**: Now uses `Effect` and `Effect.gen`. Deleted old `src/to-migrate/variable-resolver.ts`.
- **Notes**: Needs further testing for all variable resolution cases.

### Input Box Filter

- **Status**: Refactored in `src/commands/inputbox-filter.ts`.
- **Changes**: Rewritten to use `Effect`. Now properly integrated into `setup-env.ts`.

### Commands

- **Status**: `src/commands.ts` moved to `src/commands/general.ts` and updated.
- **Changes**: Imports updated. `openExamples` uses `Effect`.

## Technical Debt & TODOs

- [ ] **Variable Resolver**: Verify all token replacements work as expected (mocking VS Code API might be needed for tests).
- [ ] **Jq Options**: `src/utils/jq-options.ts` was fixed for type errors but could be further improved with Effect-based parsing/validation if needed.
- [ ] **Testing**: Add unit tests for the new `VariableResolver` and `InputBoxFilter` logic.
- [ ] **Renderers**: `src/utils/renderers.ts` might benefit from being a proper Service if it holds state or complex logic.
- [ ] **Cleanup**: `src/trash/` folder should be reviewed and deleted if not needed.
- [ ] **Code Lens**: `src/code-lens.ts` still has some logic that could be moved to a service or utility.

## Notes

- `src/extension.ts` wires everything together using `MainLive` layer.
- Ensure `pre-commit` checks pass before submitting.
