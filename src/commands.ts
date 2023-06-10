import { Editor, MarkdownView } from 'obsidian';
import VaultTransferPlugin from 'main';
import { transferNote } from 'transfer';

export function addCommands(plugin: VaultTransferPlugin) {
    // Transfer note to other vault
    plugin.addCommand({
        id: 'transfer-note-to-vault',
        name: 'Transfer current note to other vault',
        editorCallback: (editor: Editor, view: MarkdownView) => {
            transferNote(editor, view, plugin.app, plugin.settings);
        }
    });
}