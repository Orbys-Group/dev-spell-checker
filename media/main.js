// @ts-ignore 

// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.
(function () {
    const vscode = acquireVsCodeApi();
    document.querySelectorAll('.delete').forEach((button) => {
        button.addEventListener('click', () => {
            vscode.postMessage({
                type: 'delete',
                value: button.getAttribute('data-id')
            });
        });
    });

    tippy('.delete', {
        content: 'Borrar',
    });
    document.querySelectorAll('.goto').forEach((button) => {
        button.addEventListener('click', () => {
            vscode.postMessage({
                type: 'goto',
                value: button.getAttribute('data-id')
            });
        });
    });
    document.querySelectorAll('.back').forEach((button) => {
        button.addEventListener('click', () => {
            vscode.postMessage({
                type: 'back',
                value: button.getAttribute('data-id')
            });
        });
    });
    tippy('.goto', {
        content: 'Ver archivo',
    });
    tippy('.back', {
        content: 'Restablecer',
    });
    const loader = document.querySelector('.loader');
    loader.style.display = 'none';
    window.addEventListener("message", (event) => {
        if (event.data.type === 'loader') {
            loader.style.display = event.data.value === 'show' ? 'flex' : 'none';
        }
    });
})();