import * as vscode from 'vscode';
let config = vscode.workspace.getConfiguration('ortografix');
let apiKey = config.get('openAIKey');
let modeloIA = config.get('modeloIA');
let findOnCorrect = config.get('findOnCorrect');
let language = config.get('language');

import { OpenAI } from 'openai';
import { CorrectionsProvider } from './correctionsProvider';
import PanelViewProvider from './panel_view_provider';
import { v4 as uuidv4 } from 'uuid';
import { badWords } from '.';

const openai = new OpenAI({
    apiKey: apiKey as string,
});

const recargar = async () => {
    const seleccion = await vscode.window.showInformationMessage('La configuración ha cambiado, ¿deseas recargar la ventana para aplicar los cambios?', 'Recargar', 'Cancelar');
    if (seleccion === 'Recargar') {
        vscode.commands.executeCommand('workbench.action.reloadWindow');
    }
};

vscode.workspace.onDidChangeConfiguration(async event => {
    if (event.affectsConfiguration('ortografix.modeloIA')) {
        modeloIA = config.get('modeloIA');
        await recargar();
    }
    if (event.affectsConfiguration('ortografix.openAIKey')) {
        apiKey = config.get('openAIKey');
        await recargar();
    }
    if (event.affectsConfiguration('ortografix.findOnCorrect')) {
        findOnCorrect = config.get('findOnCorrect');
        await recargar();
    }
    if (event.affectsConfiguration('ortografix.language')) {
        language = config.get('language');
        await recargar();
    }
});
async function corregirTexto(texto: string) {
    let prompt = `Eres un experto en gramática y ortografía del idioma español. Tu tarea es ayudarme a corregir textos. Te proporcionaré un texto y 
    tu deberás devolverme únicamente el texto corregido, agrega las tildes donde sea necesario, solo corregir errores de 
    ortografía y gramática, y si el texto esta en otro idioma, debes traducirlo a español. No debes agregar puntos al final a menos que el texto original los tenga. Si el texto que te proporciono no requiere 
    correcciones, debes responder solo con la palabra [OK]. Por ejemplo, si te proporciono el texto "la casa d ppel", tu respuesta debería ser 
    "La casa de papel". Si te proporciono el texto "la casa de papel", tu respuesta debería ser [OK]`;
    if (language === 'en') {
        prompt = `Eres un experto en gramática y ortografía del idioma ingles. Tu tarea es ayudarme a corregir textos. Te proporcionaré un texto y 
    tu deberás devolverme únicamente el texto corregido, debes corregir errores de 
    ortografía y gramática y si el texto esta en otro idioma, debes traducirlo a ingles. No debes agregar puntos al final a menos que el texto original los tenga. Si el texto que te proporciono no requiere 
    correcciones, debes responder solo con la palabra [OK]. Por ejemplo, si te proporciono el texto "la casa d ppel", tu respuesta debería ser 
    "The Money Heist". Si te proporciono el texto "I am a developer", tu respuesta debería ser [OK]`;
    }
    console.log(language);
    const response = await openai.chat.completions.create({
        model: modeloIA as string,
        messages: [
            {
                "role": "system",
                "content": prompt
            }, {
                "role": "user",
                "content": `${texto}`
            }
        ],
    });

    return response.choices[0].message.content;
}
function getWebviewContent(webview: vscode.Webview, context: vscode.ExtensionContext) {
    const orbys = webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'resources', 'logoWhite.png'));
    return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Ortografix View</title>
        </head>
        <body>
            <h1>Dev spell cheker V0.0.1</h1>
            <img src="${orbys}" alt="Orbys Logo" height="100">
            <p>Esta es una extensión simple que usa la API de ChatGPT para corregir la ortografía de tus cadenas de texto. 
            Inicialmente solo soporta español, pero intentaré seguir trabajando en ella para que soporte otros idiomas.</p>
            <a href="https://orbysgroup.com" target="_blank">Orbys Group</a>
        </body>
        </html>`;
}

export function activate(context: vscode.ExtensionContext) {
    let globalState = context.globalState;
    let correctionsProvider = new CorrectionsProvider(globalState);

    let disposable = vscode.commands.registerCommand('ortografix.checkSpelling', () => {
        const editor = vscode.window.activeTextEditor;
        if (!apiKey) {
            vscode.window.showWarningMessage('Por favor, configura tu clave API de OpenAI para que la extensión funcione correctamente, luego recarga la ventana para que los cambios surjan efecto.');
            return;
        }
        let statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
        statusBarItem.text = "$(sync~spin) Buscando errores...";


        function addQuotesIfMissing(text: string, originalText: string) {
            if (text === '[OK]' || text === 'OK') {
                text = originalText;
            }
            if (!text.match(/^['"].*['"]$/)) {
                text = `"${text.replace(/"/g, '\\"')}"`;
            }
            const regex = /\[OK\]$/;
            if (regex.test(text)) {
                text = text.replace("[OK]", "");
            }
            return text;
        }

        function isQuoted(text: string) {
            // La expresión regular busca cadenas que comienzan y terminan con "", '', o ``
            const regex = /^["'].*["']$|^`.*`$/;
            return regex.test(text);
        }

        function endsWithOK(text: string) {
            // La expresión regular busca la palabra [OK] al final de la cadena
            const regex = /\[OK\]$/;
            return regex.test(text);
        }

        if (editor) {
            const document = editor.document;
            const selection = editor.selection;
            const start = selection.start;
            const end = selection.end;


            // Get the word within the selection
            const word = document.getText(selection);
            
            // console.log(apiKey);
            // const newText = apiKey;
            const edit = new vscode.WorkspaceEdit();
            // edit.replace(document.uri, selection, newText as string || '');
            // vscode.workspace.applyEdit(edit);
            statusBarItem.show();
            provider.showLoader();
            const malasPalabras: badWords = globalState.get('malasPalabras') || {};
            if (malasPalabras) {
                const keys = Object.keys(malasPalabras);
                for (let i = 0; i < keys.length; i++) {
                    const element = malasPalabras[keys[i]];
                    if (element.incorrect === word || (findOnCorrect && element.correct === word)) {
                        //retardo de 5 segundo para que el loader no se oculte antes de que el usuario pueda verlo
                        setTimeout(() => {
                            provider.hideLoader();
                            statusBarItem.hide();
                            edit.replace(document.uri, selection, `${element.correct}` || '');
                            vscode.workspace.applyEdit(edit);
                            //actualizar el contador
                            const count = element.count ? element.count + 1 : 1;
                            //actualizar el estado global
                            globalState.update('malasPalabras', {
                                ...globalState.get('malasPalabras'),
                                [element.id]: {
                                    ...element,
                                    count: count,
                                    restablecida: false
                                }
                            });
                            correctionsProvider.refresh();
                            provider.updateGlobalState(globalState);
                            vscode.window.showInformationMessage(`He usado una palabra o frase que ya corregí anteriormente. Revisa el historial de correcciones para ver la corrección que hice anteriormente.`);
                        }, 1000);
                        return;
                    }
                }
            }
            corregirTexto(word).then(async (response) => {
                let newText = addQuotesIfMissing(response as string, word);
                const comillas = isQuoted(word);
                if (!comillas) {
                    newText = newText.replace(/"/g, '');
                }

                if (endsWithOK(newText)) {
                    newText = newText.replace("[OK]", "");
                }


                if (response === '[OK]') {
                    vscode.window.showInformationMessage(`No encontré errores de ortografía, ni gramática en el texto seleccionado.`);
                } else {
                    edit.replace(document.uri, selection, `${newText}` || '');
                    vscode.workspace.applyEdit(edit);
                    const id = uuidv4();
                    await globalState.update('malasPalabras', {
                        ...globalState.get('malasPalabras'),
                        [id]: {
                            correct: newText,
                            incorrect: word,
                            date: new Date(),
                            uri: document.uri,
                            id: id,
                            count: 1,
                            start: start,
                            end: end,
                            restablecida: false
                        }
                    });
                    correctionsProvider.refresh();
                    provider.updateGlobalState(globalState);
                }
                statusBarItem.hide();
                provider.hideLoader();
            }).catch((error) => {
                console.error(error);
            });
        }
    });

    let clearCorrections = vscode.commands.registerCommand('ortografix.clearList', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            // const document = editor.document;
            globalState.update('malasPalabras', {});
            correctionsProvider.refresh();
            provider.updateGlobalState(globalState);
        }
    });

    let webview = vscode.commands.registerCommand('ortografix.ortografixView', () => {
        const panel = vscode.window.createWebviewPanel(
            'ortografix Web', // Identificador del panel
            'Dev spell checker', // Título que se muestra en la pestaña del panel
            vscode.ViewColumn.One, // Columna en la que se mostrará el panel
            {
                enableScripts: true
            }
        );

        panel.webview.html = getWebviewContent(panel.webview, context);
    });

    const commandAsk = vscode.commands.registerCommand('ortografix.ask', () => {
        // vscode.window.showInputBox({ prompt: 'Que quieres saber?' }).then((value) => {
        //     console.log(value);
        // });
        vscode.window.showInformationMessage(`Heee 😂 pronto implementare algo`);
    });

    const provider = new PanelViewProvider(context.extensionUri, globalState);



    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider("ortografix.webview", provider)
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('ortografix.webview', () => {
            vscode.window.createWebviewPanel(
                'panelViewProvider',
                'Ortografix View',
                vscode.ViewColumn.One,
                {
                    enableScripts: true,
                    localResourceRoots: [vscode.Uri.file(context.extensionPath)]
                }
            );
        })
    );

    context.subscriptions.push(disposable, clearCorrections, webview, commandAsk);
}

export function deactivate() { }
