import { Notice } from "obsidian";

export function showNotice(message: string) {
    new Notice(message);
}