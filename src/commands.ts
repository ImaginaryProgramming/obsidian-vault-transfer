import { Editor, MarkdownView, TFile, TFolder } from 'obsidian';
import VaultTransferPlugin from 'main';
import { insertLinkToOtherVault, transferFolder, transferNote } from 'transfer';

export function addCommands(plugin: VaultTransferPlugin) {
    /**
     * Transfers the contents of the current note to a file in the other vault with the same name.
     * Then, replaces the contents of the current note with a link to the new file.
     */
    plugin.addCommand({
        id: 'transfer-note-to-vault',
        name: 'Transfer current note to other vault',
        editorCallback: (editor: Editor, view: MarkdownView) => {
            transferNote(editor, view.file, plugin.app, plugin.settings);
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

/**
 * Add a command under the file menu to transfer the current file or folder to another vault.
 * If a folder is selected, all files in the folder will be transferred.
 * @param plugin {VaultTransferPlugin} The plugin instance
 */
export function addMenuCommands(plugin: VaultTransferPlugin) {
    plugin.registerEvent(
      plugin.app.workspace.on("file-menu", (menu, file) => {
        menu.addItem((item) => {
          item
            .setTitle("Transfer to other vault")
            .setIcon("arrow-right-circle")
            .onClick(async () => {
              if (file instanceof TFolder) {
                transferFolder(file, plugin.app, plugin.settings)
              } else if (file instanceof TFile) {
                transferNote(null, file as TFile, plugin.app, plugin.settings);
              }
            });
        });
      })
    );
}