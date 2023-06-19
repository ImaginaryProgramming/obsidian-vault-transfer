import VaultTransferPlugin from 'main';
import { App, PluginSettingTab, Setting, normalizePath } from 'obsidian';

export interface VaultTransferSettings {
    outputVault: string;
    outputFolder: string;
    createLink: boolean; 
    deleteOriginal: boolean; //only relevant if createLink is false
    moveToSystemTrash: boolean; //only relevant if deleteOriginal is true
    overwrite: boolean; //if set to false => skip file if it already exists
}

export const DEFAULT_SETTINGS: VaultTransferSettings = {
    outputVault: '',
    outputFolder: '',
    createLink: true,
    deleteOriginal: false,
    moveToSystemTrash: false,
    overwrite: false
}

export class SettingTab extends PluginSettingTab {
    plugin: VaultTransferPlugin;

    constructor(app: App, plugin: VaultTransferPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;

        containerEl.empty();

        containerEl.createEl('h2', { text: 'Settings' });
        containerEl.createEl('h3', { text: 'Path settings' });

        new Setting(containerEl)
            .setName('Output Vault')
            .setDesc('The full file path to the other vault root folder.')
            .addText(text => text
                .setPlaceholder('C:/MyVault')
                .setValue(this.plugin.settings.outputVault)
                .onChange(async (value) => {
                    this.plugin.settings.outputVault = normalizePath(value);
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Output Folder')
            .setDesc('The folder within the vault the file should be copied to.')
            .addText(text => text
                .setPlaceholder('Unsorted/Transfer')
                .setValue(this.plugin.settings.outputFolder)
                .onChange(async (value) => {
                    this.plugin.settings.outputFolder = normalizePath(value);
                    await this.plugin.saveSettings();
                }));
        
        new Setting(containerEl)
            .setName('Create Link')
            .setDesc('Add a link to the new file in the new vault to the current note. If set to false, the file will be left unchanged, but you can choose to delete the original with the setting below.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.createLink)
                .onChange(async (value) => {
                    this.plugin.settings.createLink = value;
                    await this.plugin.saveSettings();
                    this.display();
                }
            ));
        if (!this.plugin.settings.createLink) {
            containerEl.createEl('h3', { text: 'Deleting the original file settings' });
            new Setting(containerEl)
                .setName('Delete Original')
                .setDesc('If set to true, the original file will be deleted')
                .addToggle(toggle => toggle
                    .setValue(this.plugin.settings.deleteOriginal)
                    .onChange(async (value) => {
                        this.plugin.settings.deleteOriginal = value;
                        await this.plugin.saveSettings();
                        this.display();
                    }
                ));
            if (this.plugin.settings.deleteOriginal) {
                new Setting(containerEl)
                    .setName('Move to System Trash')
                    .setDesc('If set to true, the original file will be moved to the system trash. Otherwise, it will be moved to the vault trash.')
                    .addToggle(toggle => toggle
                        .setValue(this.plugin.settings.moveToSystemTrash)
                        .onChange(async (value) => {
                            this.plugin.settings.moveToSystemTrash = value;
                            await this.plugin.saveSettings();
                        }
                    ));
                }
        }

        containerEl.createEl('h3', { text: 'Other Settings' });
        new Setting(containerEl)
            .setName('Overwrite')
            .setDesc('If set to false, the file will be skipped if it already exists in the other vault.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.overwrite)
                .onChange(async (value) => {
                    this.plugin.settings.overwrite = value;
                    await this.plugin.saveSettings();
                }
            ));
    }
}