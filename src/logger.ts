import * as vscode from "vscode";

export const Logger = vscode.window.createOutputChannel("jqpg", "json");
export const Debug = vscode.window.createOutputChannel("jqpg debug");

export default Logger;
