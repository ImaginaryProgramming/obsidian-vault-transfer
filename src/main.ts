import { addCommands } from 'commands';
import { Plugin } from 'obsidian';
import { DEFAULT_SETTINGS, SettingTab, VaultTransferSettings } from 'settings';

export default class VaultTransferPlugin extends Plugin {
	settings: VaultTransferSettings;

	async onload() {
		await this.loadSettings();

		addCommands(this);

		this.addSettingTab(new SettingTab(this.app, this));
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
