import { window } from 'vscode'
import { join } from 'path'

export const currentWorkingDirectory = () =>
  join(window.activeTextEditor.document.fileName, '..')
