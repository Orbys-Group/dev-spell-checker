import * as vscode from 'vscode';
import { badWords, badWordsItem } from '.';
import * as path from 'path';
import * as fs from 'fs';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

class PanelViewProvider implements vscode.WebviewViewProvider {
	public static readonly viewType = 'ortografix.webview';
	private config = vscode.workspace.getConfiguration('ortografix');
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

	private _getLink(item: badWordsItem) {
		if (item && item.uri && item.start && item.end) {
			let final = item.incorrect.length - item.correct.length;
			if (final < 0) {
				final = final * -1;
			}
			const start = new vscode.Position(item.start.line, item.start.character);
			const end = new vscode.Position(item.end.line, final + item.end.character);
			const range = new vscode.Range(start, end);
			return range;
		} else {
			return null;
		}
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
					const malasPalabras: badWords = this.globalState.get('malasPalabras') || {};
					delete malasPalabras[data.value];
					this.globalState.update('malasPalabras', malasPalabras);
					this._update();
					break;
				}
				case 'goto': {
					const malasPalabras: badWords = this.globalState.get('malasPalabras') || {};
					const item = malasPalabras[data.value];
					const range = this._getLink(item);
					if (range) {
						const fileUri = vscode.Uri.file(item.uri.fsPath);
						vscode.workspace.openTextDocument(fileUri).then(doc => {
							vscode.window.showTextDocument(doc).then(editor => {
								editor.selection = new vscode.Selection(range.start, range.end);
								editor.revealRange(range);
							});
						});
					}
					break;

				}
				case 'back': {
					const malasPalabras: badWords = this.globalState.get('malasPalabras') || {};
					const item = malasPalabras[data.value];
					const range = this._getLink(item);					
					
					if (range) {
						const fileUri = vscode.Uri.file(item.uri.fsPath);
						vscode.workspace.openTextDocument(fileUri).then(doc => {
							vscode.window.showTextDocument(doc).then(editor => {
								editor.selection = new vscode.Selection(range.start, range.end);
								editor.revealRange(new vscode.Range(range.start, range.end));
								const edit = new vscode.WorkspaceEdit();
								edit.replace(fileUri, range, item.incorrect);
								vscode.workspace.applyEdit(edit);
								this.globalState.update('malasPalabras', {
									...this.globalState.get('malasPalabras'),
									[item.id]: {
										...item,
										restablecida:true,
										count: item.count ? item.count - 1 : 1
									}
								});
								this._update();
							});
						});
					}
					break;
				}
			}
		});
	}

	private _update() {
		if (this._view) {
			this._view.webview.html = this._getHtmlForWebview(this._view.webview);
		}
	}

	public showLoader() {
		if (this._view) {
			this._view.webview.postMessage({ type: 'loader', value: 'show' });
		}
	}

	public hideLoader() {
		if (this._view) {
			this._view.webview.postMessage({ type: 'loader', value: 'hide' });
		}
	}


	private _limpiarCadena(cadena: string) {
		return cadena.replace(/\"/g, '');
	}

	private _getHtmlForWebview(webview: vscode.Webview) {
		const palagras: badWords = this.globalState.get('malasPalabras') || {};
		const ok = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'resources', 'ok.svg'));
		const ir = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'resources', 'ver.svg'));
		const back = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'resources', 'back.svg'));
		const deletei = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'resources', 'delete.svg'));
		const modeloIA = this.config.get('modeloIA');
		const findOnCorrect = this.config.get('findOnCorrect');
		const language = this.config.get('language');
		const palabritas = Object.entries(palagras).map(([key, item]) => {
			const fechaUTC = new Date(item.date);
			const fecha = format(fechaUTC, "EEEE dd 'de' MMMM 'de' yyyy, hh:mm:ss aa", { locale: es });
			return /*html*/`<li class="relative flex flex-row gap-2 items-start justify-between p-2 rounded-md odd:bg-white/5 group cursor-pointer">
				<div class="w-8 h-8 flex flex-col ">
					<div class="flex-none w-8 h-8 p-1 rounded-full bg-white/5 stroke-white flex items-center justify-center">
						<img src="${ok}" class="w-full h-full !text-white" alt="${item.correct}" />
					</div>
					<div class="text-green-100 text-xs flex items-center mt-1 justify-center p-1 h-4 rounded-full bg-blue-700">${item.count || 1}</div>
				</div>
				<div class="grow flex flex-col items-center justify-start">
					<div class="text-white w-full flex flex-row items-center gap-1">	
					${this._limpiarCadena(item.correct)}
					</div>
					
					<small class="text-white text-[10px] m-0 p-0 text-white/20 w-full">${this._limpiarCadena(key)}</small>
					<div class="text-blue-500 text-xs text-center w-full  rounded-md p-2 pl-0  flex flex-row items-center justify-end gap-2" >
						<small class="text-left text-white grow ">${fecha}</small>
						<button class="w-6 h-6 p-1 rounded-md goto flex items-center justify-center hover:bg-white/5" data-id="${item.id}">
							<img src="${ir}" class="w-full h-full !text-white" alt="${item.correct}" />
						</button>
						<button class="w-6 h-6 p-1 rounded-md back flex items-center justify-center hover:bg-white/5 ${item.restablecida&&'hidden'}" data-id="${item.id}">
							<img src="${back}" class="w-full h-full !text-white" alt="${item.correct}" />
						</button>
						<button class="w-6 h-6 p-1 group/svg rounded-md delete flex items-center justify-center hover:bg-white/5" data-id="${item.id}">
							<img src="${deletei}" class="w-full h-full  !text-white" alt="${item.correct}" />
						</button>
					</div>
				</div>
			</li>`;
		});
		const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'main.js'));
		const tailwindUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'script', 'tailwind.min.js'));
		const popper = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'script', 'popper.min.js'));
		const tippy = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'script', 'tippy-bundle.umd.min.js'));
		const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'style.css'));
		const loader = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'resources', 'loader.gif'));
		// const texto = html`<div>Hello !</div>`.values.toString();
		// console.log(JSON.stringify(texto));
		return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<title>React App</title>
				<script src="${tailwindUri}"></script>
				<link href="${styleUri}" rel="stylesheet">
				<style>
				.code {
					white-space : pre;
				}		
				</style>
			</head>
			<body class="flex flex-col h-screen">
				<!-- <input class="h-10 w-full text-white bg-stone-700 p-4 text-sm" type="text" id="prompt-input" /> -->
				<header class="p-2">
					<div class="flex flex-row gap-2 items-center h-15 justify-between w-full">
						<span><span class="text-blue-700 font-bold">Modelo IA:</span> ${modeloIA}</span>
						<span><span class="text-blue-700 font-bold">Lenguaje:</span> <span class="uppercase">${language}</span></span>
						${findOnCorrect ? `<span><span class="text-blue-700 font-bold">Buscar en correctas:</span> ${findOnCorrect ? 'Si' : 'No'}</span>` : ''}
					</div>
					<div class="flex flex-col items-center h-15 justify-center w-full loader">
						<img src="${loader}" class="w-12 h-12 p-1 animate-pulse rounded-full stroke-white flex items-center justify-center" alt="ok" />
						<span class="text-white text-sm">Generando</span>
					</div>
				</header>
				<main class="flex-grow overflow-y-scroll">
					<div id="response" class="pt-2 text-sm flex flex-col gap-2">						
						<ul class=" flex flex-col gap-2 max-h-full overflow-y-scroll overflow-x-hidden p-2 w-full">
							${palabritas.join('')}
						</ul>						
					</div>				
				</main>
				<footer class="h-5 w-full text-center">
					Orbys Group &copy; ${new Date().getFullYear()}
				</footer>
				<script src="${popper}"></script>
				<script src="${tippy}"></script>
				<script src="${scriptUri}"></script>
			</body>
			</html>`;
	}
}

export default PanelViewProvider;