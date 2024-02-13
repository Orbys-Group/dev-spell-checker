import * as vscode from 'vscode';
import { badWords } from '.';
import * as path from 'path';
import  * as fs from 'fs';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

class PanelViewProvider implements vscode.WebviewViewProvider {
	public static readonly viewType = 'ortografix.webview';

	private _view?: vscode.WebviewView;
	
	
	public selectedInsideCodeblock = false;
	public pasteOnClick = true;
	public keepConversation = true;
	public timeoutLength = 60;
	private globalState: vscode.Memento;
	// In the constructor, we store the URI of the extension
	constructor(private readonly _extensionUri: vscode.Uri, globalState: vscode.Memento) {
		this.globalState = globalState;
		// let malasPalabras = this._globalState.get('malasPalabras');
		// console.log(malasPalabras);
	}

	public updateGlobalState(newGlobalState: vscode.Memento) {
        this.globalState = newGlobalState;
        this._update();
    }
	

	public resolveWebviewView(
		webviewView: vscode.WebviewView,
		context: vscode.WebviewViewResolveContext,
		_token: vscode.CancellationToken,
	) {
		this._view = webviewView;
		// set options for the webview
		webviewView.webview.options = {
			// Allow scripts in the webview
			enableScripts: true,
			localResourceRoots: [
				this._extensionUri,
				webviewView.webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'resources')),
				vscode.Uri.file(path.join(this._extensionUri.fsPath, 'media')),

			]
		};
		this._update();
		webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);		
		webviewView.webview.onDidReceiveMessage(data => {
			switch (data.type) {
				case 'delete': {
					console.log(data.value);
					const malasPalabras:badWords = this.globalState.get('malasPalabras') || {};
					delete malasPalabras[data.value];
					this.globalState.update('malasPalabras', malasPalabras);
					this._update();

				}
			}
		});
	}

	private _update() {
        if (this._view) {
            this._view.webview.html = this._getHtmlForWebview(this._view.webview);
        }
    }


	private _limpiarCadena(cadena: string) {
		return cadena.replace(/\"/g, '');
	}

	private _getHtmlForWebview(webview: vscode.Webview) {	
		const palagras:badWords = this.globalState.get('malasPalabras') || {};
		const ok = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'resources', 'ok.svg'));
		
		const palabritas = Object.entries(palagras).map(([key, value]) => {
			const fechaUTC = new Date(value.date);
			const fecha = format(fechaUTC, "EEEE dd 'de' MMMM 'de' yyyy, hh:mm:ss aa", { locale: es });
			return `<li class="flex flex-row gap-2 items-start justify-between cursor-pointer p-2 rounded-md hover:bg-white/5">
				<div class="flex-none w-10 h-10 p-2 rounded-full bg-white/5 stroke-white flex items-center justify-center">
					<img src="${ok}" class="w-full h-full !text-white" alt="${value.correct}" />
				</div>
				<div class="grow flex flex-col gap-1 items-center justify-start">
					<div class="text-white w-full">${this._limpiarCadena(value.correct)}</div>
					<small class="text-white text-green-600 w-full">${fecha}</small>
					<small class="text-white text-white/20 w-full">${this._limpiarCadena(key)}</small>
				</div>
				<button data-id="${value.id}" class="flex-none w-8 h-8 stroke-white flex items-center justify-center text-red-400 font-bold rounded-full hover:bg-red-600 hover:text-white delete">
					X
				</button>
			</li>`;
		});	
		const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'main.js'));
		const tailwindUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'script', 'tailwind.min.js'));
		
		return /**html*/`<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<title>React App</title>
				<script src="${tailwindUri}"></script>
				<style>
				.code {
					white-space : pre;
				}
				</style>
			</head>
			<body>
				<!-- <input class="h-10 w-full text-white bg-stone-700 p-4 text-sm" type="text" id="prompt-input" /> -->

				<div id="response" class="pt-6 text-sm">
					<ul>
						${palabritas.join('')}
					</ul>
				</div>

				<script src="${scriptUri}"></script>
			</body>
			</html>`;
	}
}

export default PanelViewProvider;