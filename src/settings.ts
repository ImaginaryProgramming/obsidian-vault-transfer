import VaultTransferPlugin from 'main';
import { App, PluginSettingTab, Setting, normalizePath } from 'obsidian';

export interface VaultTransferSettings {
    outputVault: string;
    outputFolder: string;
    automaticCreateOutputFolder: boolean;
    createLink: boolean;
    dateVariable: {
        type: "frontmatter" | "creation" | "modification";
        fallback?: "creation" | "modification";
        frontmatterKey?: string;
    }
    deleteOriginal: boolean; //only relevant if createLink is false
    moveToSystemTrash: boolean; //only relevant if deleteOriginal is true
    overwrite: boolean; //if set to false => skip file if it already exists
    recreateTree: boolean; //if set to true => recreate the folder structure in the new vault
    removePath: string[]; //allow to remove parts of the path, separate in the settings by space/comma
}

export const DEFAULT_SETTINGS: VaultTransferSettings = {
    outputVault: '',
    automaticCreateOutputFolder: false,
    dateVariable: {
        type: "frontmatter",
        frontmatterKey: "date"
    },
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

        containerEl.createEl('h2', { text: 'Path settings' });

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
            .setDesc('The folder within the vault the file should be copied to. You can use a variable date using {{date-format}}, like {{YYYY-MM-DD}}.')
            .addText(text => text
                .setPlaceholder('Unsorted/Transfer')
                .setValue(this.plugin.settings.outputFolder)
                .onChange(async (value) => {
                    this.plugin.settings.outputFolder = normalizePath(value);
                    await this.plugin.saveSettings();
                    this.display();
                }));

        this.containerEl.createEl('h3', { text: 'Date Variable' });      
        this.containerEl.createEl('p', { text: 'The date variable to use for the output folder. For folder, will use the folder note date by default. If this note doesn\'t exists, will use the fallback with folder data.' });      

        new Setting(containerEl)
            .setName('Date Variable')
            .setDesc('The date variable to use for the output folder. If set to frontmatter, you can specify the key. If set to creation or modification, the date will be used.')
            .addDropdown(dropdown => dropdown
                .addOptions({
                    frontmatter: 'Frontmatter',
                    creation: 'Creation Date',
                    modification: 'Modification Date'
                })
                .setValue(this.plugin.settings.dateVariable.type)
                .onChange(async (value : "frontmatter" | "creation" | "modification") => {
                    this.plugin.settings.dateVariable.type = value;
                    await this.plugin.saveSettings();
                    this.display();
                }
                ));
        if (this.plugin.settings.dateVariable.type == "frontmatter") {
            new Setting(containerEl)
                .setName('Frontmatter Key')
                .setDesc('The key to use for the frontmatter date.')
                .addText(text => text
                    .setPlaceholder('date')
                    .setValue(this.plugin.settings.dateVariable.frontmatterKey || 'date')
                    .onChange(async (value) => {
                        this.plugin.settings.dateVariable.frontmatterKey = value;
                        await this.plugin.saveSettings();
                    }));
            
            new Setting(containerEl)
                .setName('Fallback Date')
                .setDesc('The date to use if the frontmatter date is not set. Can be the last modification time or the file creation file.')
                .addDropdown(dropdown => dropdown
                    .addOptions({
                        creation: 'Creation Date',
                        modification: 'Modification Date'
                    })
                    .setValue(this.plugin.settings.dateVariable.fallback || 'creation')
                    .onChange(async (value : "creation" | "modification") => {
                        this.plugin.settings.dateVariable.fallback = value;
                        await this.plugin.saveSettings();
                    }
                    ));
        }
        
        containerEl.createEl('h2', { text: 'Folder and tree creation' });

        new Setting(containerEl)
            .setName('Automatic Create Output Folder')
            .setDesc('If set to true, the folder will be created if it does not exist. Usefull if using a date variable.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.automaticCreateOutputFolder)
                .onChange(async (value) => {
                    this.plugin.settings.automaticCreateOutputFolder = value;
                    await this.plugin.saveSettings();
                }
                ));        
        new Setting(containerEl)
            .setName('Recreate Folder Structure')
            .setDesc('If set to true, the folder structure of the original file will be recreated in the new vault.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.recreateTree)
                .onChange(async (value) => {
                    this.plugin.settings.recreateTree = value;
                    this.display();
                    await this.plugin.saveSettings();
                }
                ));        

        if (this.plugin.settings.recreateTree) {
            new Setting(containerEl)
                .setName('Remove Folders From Path')
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

        containerEl.createEl('h2', { text: 'File and content management' });

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