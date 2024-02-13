import { Uri } from 'vscode';
type badWords = {
    [key: string]: {
        correct: string;
        incorrect: string;
        date: Date;
        uri: Uri;
        id: string;
    }
};