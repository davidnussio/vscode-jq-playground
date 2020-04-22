// eslint-disable-next-line no-unused-vars
import { window, env, Uri, MessageItem } from 'vscode'

export class Messages {
  static async showWhatsNewMessage(version: string) {
    const actions: MessageItem[] = [{ title: 'Release Notes' }]

    const result = await window.showInformationMessage(
      `
      jq playground has been updated! Now support jq operators and functions 
      autocomplete and jq command line options ${version}
      `,
      ...actions,
    )

    if (result != null) {
      if (result === actions[0]) {
        await env.openExternal(
          Uri.parse(
            'https://github.com/davidnussio/vscode-jq-playground/blob/master/CHANGELOG.md',
          ),
        )
      }
    }
  }
}
