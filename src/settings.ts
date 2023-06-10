import VaultTransferPlugin from 'main';
import { App, PluginSettingTab, Setting } from 'obsidian';

export interface VaultTransferSettings {
    outputVault: string;
    outputFolder: string;
}

export const DEFAULT_SETTINGS: VaultTransferSettings = {
    outputVault: '',
    outputFolder: '',
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

        new Setting(containerEl)
            .setName('Output Vault')
            .setDesc('The full file path to the other vault root folder.')
            .addText(text => text
                .setPlaceholder('C:/MyVault')
                .setValue(this.plugin.settings.outputVault)
                .onChange(async (value) => {
                    this.plugin.settings.outputVault = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Output Folder')
            .setDesc('The folder within the vault the file should be copied to.')
            .addText(text => text
                .setPlaceholder('Unsorted/Transfer')
                .setValue(this.plugin.settings.outputFolder)
                .onChange(async (value) => {
                    this.plugin.settings.outputFolder = value;
                    await this.plugin.saveSettings();
                }));
    }
}