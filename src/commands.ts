import { Editor, MarkdownView, Menu, TFile, TFolder } from 'obsidian';
import VaultTransferPlugin from 'main';
import { insertLinkToOtherVault, transferFolder, transferNote } from 'transfer';
import { FolderSuggestModal } from 'modals';
import * as fs from 'fs';
import * as path from "path"
import { showNotice } from 'utils';

export interface Folder {
  absPath: string
  relPath: string
}

export function addCommands(plugin: VaultTransferPlugin) {
  /**
   * Transfers the contents of the current note to a file in the other vault with the same name.
   * Then, replaces the contents of the current note with a link to the new file.
   */
  plugin.addCommand({
    id: 'transfer-note-to-vault',
    name: 'Transfer current note to other vault',
    editorCallback: (editor: Editor, view: MarkdownView) => {
      if (view.file == null) {
        showNotice("Error: view.file is null");
        return;
      }

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
          .setTitle("Vault Transfer")
          .setIcon("arrow-right-circle")
        //@ts-ignore
        const submenu = item.setSubmenu() as Menu;
        submenu.addItem((subitem) => {
          subitem
            .setTitle("Transfer")
            .setIcon("arrow-right-circle")
            .onClick(async () => {
              if (file instanceof TFolder) {
                transferFolder(file, plugin.app, plugin.settings)
              } else if (file instanceof TFile) {
                transferNote(null, file, plugin.app, plugin.settings);
              }
            });
          submenu.addItem((subitem) => {
            subitem
              .setTitle("Transfer to...")
              .setIcon("arrow-right-circle")
              .onClick(async () => {
                //get all folder in the output vault
                const folders: Folder[] = fs.readdirSync(plugin.settings.outputVault)
                  .filter((file) => fs.statSync(plugin.settings.outputVault + "/" + file).isDirectory())
                  .filter((folder) => folder != plugin.app.vault.configDir)
                  .map((folder) => {
                    return {
                      absPath: plugin.settings.outputVault + "/" + folder,
                      relPath: folder
                    }
                  });
                //add an option to transfer to the vault root
                folders.push({
                  absPath: plugin.settings.outputVault,
                  relPath: path.basename(plugin.settings.outputVault)
                })
                //add an option to create a new folder
                folders.push({
                  absPath: "",
                  relPath: "Create new folder"
                })
                new FolderSuggestModal(plugin, plugin.app, plugin.settings, folders, file).open();
              });
          });
        });
      });
    })
  );
}

export function addSubMenuCommands(plugin: VaultTransferPlugin) {

}