import VaultTransferPlugin from 'main';
import { App, PluginSettingTab, Setting, normalizePath } from 'obsidian';

export interface VaultTransferSettings {
    outputVault: string;
    outputFolder: string;
    createLink: boolean;
    deleteOriginal: boolean; //only relevant if createLink is false
    moveToSystemTrash: boolean; //only relevant if deleteOriginal is true
    overwrite: boolean; //if set to false => skip file if it already exists
    recreateTree: boolean; //if set to true => recreate the folder structure in the new vault
    removePath: string[]; //allow to remove parts of the path, separate in the settings by space/comma
}

export const DEFAULT_SETTINGS: VaultTransferSettings = {
    outputVault: '',
    outputFolder: '',
    createLink: true,
    deleteOriginal: false,
    moveToSystemTrash: false,
    overwrite: false,
    recreateTree: false,
    removePath: []
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

        new Setting(containerEl).setName('Path').setHeading();

        new Setting(containerEl)
            .setName('Output vault')
            .setDesc('The full file path to the other vault root folder.')
            .addText(text => text
                .setPlaceholder('C:/MyVault')
                .setValue(this.plugin.settings.outputVault)
                .onChange(async (value) => {
                    this.plugin.settings.outputVault = normalizePath(value);
                    await this.plugin.saveSettings();
                })
            );

        new Setting(containerEl)
            .setName('Output folder')
            .setDesc('The folder within the vault the file should be copied to.')
            .addText(text => text
                .setPlaceholder('Unsorted/Transfer')
                .setValue(this.plugin.settings.outputFolder)
                .onChange(async (value) => {
                    this.plugin.settings.outputFolder = normalizePath(value);
                    await this.plugin.saveSettings();
                })
            );
        new Setting(containerEl)
            .setName('Recreate folder structure')
            .setDesc('If set to true, the folder structure of the original file will be recreated in the new vault.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.recreateTree)
                .onChange(async (value) => {
                    this.plugin.settings.recreateTree = value;
                    this.display();
                    await this.plugin.saveSettings();
                })
            );

        if (this.plugin.settings.recreateTree) {
            new Setting(containerEl)
                .setName('Remove folders from path')
                .setDesc('Removes the specified folders from the output path, if present. Separate folders by using a comma or a new line. Names are case insensitive.')
                .addTextArea(text =>
                    text
                        .setPlaceholder('RemoveThisFolder, AndThis')
                        .setValue(this.plugin.settings.removePath.join(', '))
                        .onChange(async (value) => {
                            const rawPaths = value.split(/[,\n]/);
                            const cleanPaths: string[] = [];
                            // Remove empty strings, and clean up paths
                            for (const path of rawPaths) {
                                const trimmedPath = path.trim();
                                if (trimmedPath == "") {
                                    continue;
                                }
                                cleanPaths.push(normalizePath(trimmedPath));
                            }

                            this.plugin.settings.removePath = cleanPaths;
                            await this.plugin.saveSettings();
                        })
                );
        }

        new Setting(containerEl).setName('Original file').setHeading();

        new Setting(containerEl)
            .setName('Delete original')
            .setDesc('If set to true, the original file will be deleted.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.deleteOriginal)
                .onChange(async (value) => {
                    this.plugin.settings.deleteOriginal = value;
                    await this.plugin.saveSettings();
                    this.display();
                })
            );

        if (this.plugin.settings.deleteOriginal) {
            new Setting(containerEl)
                .setName('Move to system trash')
                .setDesc('If set to true, the original file will be moved to the system trash. Otherwise, it will be moved to the vault trash.')
                .addToggle(toggle => toggle
                    .setValue(this.plugin.settings.moveToSystemTrash)
                    .onChange(async (value) => {
                        this.plugin.settings.moveToSystemTrash = value;
                        await this.plugin.saveSettings();
                    })
                );
        }

        if (!this.plugin.settings.deleteOriginal) {
            new Setting(containerEl)
                .setName('Create link')
                .setDesc('Add a link to the new file in the new vault to the current note. If set to false, the file will be left unchanged.')
                .addToggle(toggle => toggle
                    .setValue(this.plugin.settings.createLink)
                    .onChange(async (value) => {
                        this.plugin.settings.createLink = value;
                        await this.plugin.saveSettings();
                        this.display();
                    })
                );
        }

        new Setting(containerEl).setName('Other').setHeading();

        new Setting(containerEl)
            .setName('Overwrite')
            .setDesc('If set to false, the file will be skipped if it already exists in the other vault.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.overwrite)
                .onChange(async (value) => {
                    this.plugin.settings.overwrite = value;
                    await this.plugin.saveSettings();
                })
            );
    }
}