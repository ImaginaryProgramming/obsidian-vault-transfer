import { Notice } from "obsidian";

export function showNotice(...message: unknown[]) {
    new Notice(message.join(" "));
    console.log(message);
}