import { Uri, Position } from 'vscode';

type badWordsItem = {
    correct: string;
    incorrect: string;
    date: Date;
    uri: Uri;
    id: string;
    count?: number;
    start?: Position;
    end?: Position;
    restablecida?: boolean ;
}
type badWords = {
    [key: string]: badWordsItem
};