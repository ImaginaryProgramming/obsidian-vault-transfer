import * as fs from 'fs';
import { App, Editor, FileSystemAdapter, MarkdownView } from 'obsidian';
import { VaultTransferSettings } from 'settings';
import { showNotice } from 'utils';

export function transferNote(editor: Editor, view: MarkdownView, app: App, settings: VaultTransferSettings) {
    try {
        // Check settings
        if (settings.outputVault.trim().length == 0) {
            showNotice("Error: Target vault has not been set.");
            return;
        }

        const outputVault = cleanPath(settings.outputVault);
        const outputFolder = cleanPath(settings.outputFolder);

        // Get paths
        const fileSystemAdapter = app.vault.adapter as FileSystemAdapter;
        const thisVaultPath = fileSystemAdapter.getBasePath();
        const fileName = view.file.name;
        const displayName = view.file.basename;
        const outputFolderPath = `${outputVault}/${outputFolder}`;
        const outputPath = `${outputFolderPath}/${fileName}`;

        // Check if directory exists to avoid error when copying
        const folderExists = fs.existsSync(outputFolderPath);
        if (!folderExists) {
            showNotice(`Error: Directory does not exist at ${outputFolderPath}`);
            return;
        }

        // Check if file exists, so we don't overwrite anything
        const fileExists = fs.existsSync(outputPath);
        if (fileExists) {
            showNotice("Error: File already exists");
            return;
        }

        // Copy to new file in other vault
        fs.copyFileSync(`${thisVaultPath}/${view.file.path}`, outputPath);

        // Get content for link
        const vaultPathArray = outputVault.split("/");
        const vaultName = vaultPathArray[vaultPathArray.length - 1];
        const urlOtherVault = encodeURI(vaultName);
        const urlFile = encodeURI(displayName);

        // Replace original file with link
        editor.setValue(`[${displayName}](obsidian://vault/${urlOtherVault}/${urlFile})`);
    }
    catch (e) {
        showNotice(`Error copying file: ${e}`);
    }
}

function cleanPath(path: string): string {
    return path.trim()
        // Replace '\' with '/'
        .replaceAll("\\", "/")
        // Remove beginning '/'
        .replace(/^\//, "")
        // Remove end '/'
        .replace(/\/$/, "");
}