import { App, FuzzySuggestModal, Modal, Setting, TAbstractFile, TFile, TFolder, normalizePath, MarkdownView } from 'obsidian';
import VaultTransferPlugin from 'main';
import { VaultTransferSettings } from 'settings';
import { Folder } from 'commands';
import { transferFolder, transferNote, listPossibleVaults } from 'transfer';
import * as fs from 'fs';
import {showNotice} from "utils";
import * as path from 'path';

/** Fuzzy modal where you can search a specific folder with the Path */


export class FolderSuggestModal extends FuzzySuggestModal<Folder> {
    plugin: VaultTransferPlugin;
    settings: VaultTransferSettings;
    app: App;
    toTransfer: TAbstractFile;
    foldersList: Folder[]

    constructor(plugin: VaultTransferPlugin, app: App, settings: VaultTransferSettings, folder: Folder[], toTransfer: TAbstractFile) {
        super(plugin.app);
        this.plugin = plugin;
        this.settings = settings;
        this.foldersList = folder;
        this.app = app;
        this.toTransfer = toTransfer;
    }

    getItems(): Folder[] {
        return this.foldersList;
    }

    getItemText(item: Folder): string {
        return item.relPath;
    }

    onChooseItem(item: Folder, evt: MouseEvent | KeyboardEvent): void {
        if (item.absPath.length == 0) {
            new CreateFolder(this.app, this.plugin, this.settings, item, this.toTransfer).open();
        } else {
            if (this.toTransfer instanceof TFolder) {
                transferFolder(this.toTransfer, this.app, this.settings, item.absPath)
            } else if (this.toTransfer instanceof TFile) {
                transferNote(null, this.toTransfer, this.app, this.settings, undefined, item.absPath);
            }
        }
    }
}

class CreateFolder extends Modal {
    app: App;
    plugin: VaultTransferPlugin;
    settings: VaultTransferSettings;
    folder: Folder;
    toTransfer: TAbstractFile;

    constructor(app: App, plugin: VaultTransferPlugin, settings: VaultTransferSettings, folder: Folder, toTransfer: TAbstractFile) {
        super(app);
        this.app = app;
        this.plugin = plugin;
        this.settings = settings;
        this.folder = folder;
        this.toTransfer = toTransfer;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.createEl('h2', { text: 'Create new folder' });
        contentEl.createEl('p', { text: 'Please enter the name of the folder you want to create' });
        new Setting(contentEl)
            .setName('Folder name')
            .setDesc("The folder will use the output vault as root")
            .addText(text => text
                .setPlaceholder('Folder name')
                .setValue('')
                .onChange(async (value) => {
                    this.folder.relPath = value;
                    this.folder.absPath = this.settings.outputVault + "/" + value;
                })
            )
            .addButton((button) => {
                button
                    .setButtonText("Create folder")
                    .onClick(async () => {
                        fs.mkdirSync(normalizePath(this.folder.absPath), { recursive: true });
                        if (this.toTransfer instanceof TFolder) {
                            transferFolder(this.toTransfer, this.app, this.settings, this.folder.absPath)
                        } else if (this.toTransfer instanceof TFile) {
                            transferNote(null, this.toTransfer, this.app, this.settings, undefined, this.folder.absPath);
                        }
                        this.close();
                    })
            })
    }
}

export class VaultSelectionModal extends FuzzySuggestModal<string> {
    rootDirectory: string;
    app: App;
    plugin: VaultTransferPlugin; // Ensure this plugin reference is passed in the constructor

    constructor(app: App, plugin: VaultTransferPlugin, rootDirectory: string) {
        super(app);
        this.rootDirectory = rootDirectory;
        this.plugin = plugin;
    }

    getItems(): string[] {
        return listPossibleVaults(this.rootDirectory);
    }

    getItemText(item: string): string {
        return item;
    }

    onChooseItem(item: string, evt: MouseEvent | KeyboardEvent): void {
        console.log('Selected Vault:', item);
        this.plugin.settings.outputVault = path.join(this.rootDirectory, item); // Adjust the outputVault setting
        const editor = this.app.workspace.getActiveViewOfType(MarkdownView)?.editor;
        const file = this.app.workspace.getActiveFile();
        if (editor && file) {
            transferNote(editor, file, this.app, this.plugin.settings);
        } else {
            showNotice("No active editor or file found.");
        }
    }
}

