import * as vscode from 'vscode';

abstract class ResultDataHandler {
    protected data:string = '';

    public onData(data) {
        this.data += data.toString()
    }

    abstract onClose();
}

export class EditorDataHandler extends ResultDataHandler {
    onClose() {
        vscode.workspace
        .openTextDocument({content: this.data, language: "jq"})
        .then(doc => vscode.window.showTextDocument(doc, vscode.ViewColumn.Two));
    }
}

export class OutputDataHandler extends ResultDataHandler {
    private logger;

    constructor(logger) {
        super();
        this.logger = logger;
    }

    onClose() {
        this.logger.clear();
        this.logger.append(this.data);
        this.logger.show();
    }
}
