import { App, Editor, MarkdownView, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { transferNote } from 'transfer';

export interface VaultTransferSettings {
	outputVault: string;
	outputFolder: string;
}

const DEFAULT_SETTINGS: VaultTransferSettings = {
	outputVault: '',
	outputFolder: '',
}

export default class VaultTransferPlugin extends Plugin {
	settings: VaultTransferSettings;

	async onload() {
		await this.loadSettings();

		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: 'transfer-note-to-vault',
			name: 'Transfer current note to other vault',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				this.app;
				transferNote(editor, view, this.app, this.settings);
			}
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SettingTab(this.app, this));
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class SettingTab extends PluginSettingTab {
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
				.setPlaceholder('D:/MyVault')
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
