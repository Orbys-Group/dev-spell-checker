// @ts-ignore 

// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.
(function () {
    const vscode = acquireVsCodeApi();
    const botones = document.querySelectorAll('.delete').forEach((button) => {
        button.addEventListener('click', () => {
            vscode.postMessage({
                type: 'delete',
                value: button.getAttribute('data-id')
            });
        });
    });
})();