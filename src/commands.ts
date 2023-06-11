import { Editor, MarkdownView } from 'obsidian';
import VaultTransferPlugin from 'main';
import { insertLinkToOtherVault, transferNote } from 'transfer';

export function addCommands(plugin: VaultTransferPlugin) {
    /**
     * Transfers the contents of the current note to a file in the other vault with the same name.
     * Then, replaces the contents of the current note with a link to the new file.
     */
    plugin.addCommand({
        id: 'transfer-note-to-vault',
        name: 'Transfer current note to other vault',
        editorCallback: (editor: Editor, view: MarkdownView) => {
            transferNote(editor, view, plugin.app, plugin.settings);
        }
    });

    /**
     * Inserts a link to the current note in the other vault, without transferring.
     */
    plugin.addCommand({
        id: 'insert-link-to-note-in-vault',
        name: 'Insert link to current note in other vault',
        editorCallback: (editor: Editor, view: MarkdownView) => {
            insertLinkToOtherVault(editor, view, plugin.settings);
        }
    });
}