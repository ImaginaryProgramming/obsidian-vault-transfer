import { Editor, MarkdownView } from 'obsidian';
import VaultTransferPlugin from 'main';
import { insertLinkToOtherVault, transferNote } from 'transfer';

export function addCommands(plugin: VaultTransferPlugin) {
    // Transfer note to other vault
    plugin.addCommand({
        id: 'transfer-note-to-vault',
        name: 'Transfer current note to other vault',
        editorCallback: (editor: Editor, view: MarkdownView) => {
            transferNote(editor, view, plugin.app, plugin.settings);
        }
    });

    // Insert link to note in other vault, without transferring
    plugin.addCommand({
        id: 'insert-link-to-note-in-vault',
        name: 'Insert link to current note in other vault',
        editorCallback: (editor: Editor, view: MarkdownView) => {
            insertLinkToOtherVault(editor, view, plugin.settings)
        }
    });
}