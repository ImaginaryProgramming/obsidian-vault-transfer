import { addCommands, addMenuCommands } from 'commands';
import { Plugin } from 'obsidian';
import { DEFAULT_SETTINGS, SettingTab, VaultTransferSettings } from 'settings';

export default class VaultTransferPlugin extends Plugin {
	settings: VaultTransferSettings;

	async onload() {
		console.log('loading vault-transfer plugin');
		await this.loadSettings();

		addCommands(this);
		addMenuCommands(this);

		this.addSettingTab(new SettingTab(this.app, this));
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	onunload(): void {
		console.log('unloading vault-transfer plugin');
	}
}
