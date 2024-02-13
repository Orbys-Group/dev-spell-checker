import * as vscode from 'vscode';

export class CorrectionsProvider implements vscode.TreeDataProvider<string> {
    private _onDidChangeTreeData: vscode.EventEmitter<string | undefined> = new vscode.EventEmitter<string | undefined>();
    readonly onDidChangeTreeData: vscode.Event<string | undefined> = this._onDidChangeTreeData.event;

    constructor(private state: vscode.Memento) {}

    getTreeItem(element: string): vscode.TreeItem {
        return {
            label: element,
            collapsibleState: vscode.TreeItemCollapsibleState.None,
            iconPath:new vscode.ThemeIcon('check'),
            description: `${element}`,
            command: {
                command: 'ortografix.replaceWord',
                title: 'Reemplazar palabra',
                arguments: [element]
            },

        };
    }

    getChildren(element?: string): Thenable<string[]> {
        let corrections = this.state.get('malasPalabras') || [];
        let keys = Object.entries(corrections).map(([key, value]) => `${value.date}`);
        return Promise.resolve(keys);
    }

    refresh(): void {
        this._onDidChangeTreeData.fire(undefined);
    }
}