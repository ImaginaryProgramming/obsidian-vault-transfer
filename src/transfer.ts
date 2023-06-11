import * as fs from 'fs';
import { App, Editor, FileSystemAdapter, MarkdownView } from 'obsidian';
import { VaultTransferSettings } from 'settings';
import { showNotice } from 'utils';

/**
 * Copies the content of the current note to another vault, then inserts a link to the new file.
 */
export function transferNote(editor: Editor, view: MarkdownView, app: App, settings: VaultTransferSettings) {
    try {
        // Check settings
        const settingsErrorShown = showErrorIfSettingsInvalid(settings);
        if (settingsErrorShown) {
            return;
        }

        const outputVault = cleanPath(settings.outputVault);
        const outputFolder = cleanPath(settings.outputFolder);

        // Get paths
        const fileSystemAdapter = app.vault.adapter as FileSystemAdapter;
        const thisVaultPath = fileSystemAdapter.getBasePath();
        const fileName = view.file.name;
        const fileDisplayName = view.file.basename;
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

        // Replace original file with link
        const link = createVaultFileLink(fileDisplayName, outputVault);
        editor.setValue(link);
    }
    catch (e) {
        showNotice(`Error copying file: ${e}`);
    }
}

/**
 * Inserts a link at the cursor to the current file in another vault.
 */
export function insertLinkToOtherVault(editor: Editor, view: MarkdownView, settings: VaultTransferSettings) {
    // Check settings
    const settingsErrorShown = showErrorIfSettingsInvalid(settings);
    if (settingsErrorShown) {
        return;
    }

    // Get display name of current file
    const fileDisplayName = view.file.basename;

    // Get output vault
    const outputVault = settings.outputVault;

    // Insert link to file
    const link = createVaultFileLink(fileDisplayName, outputVault);
    editor.replaceSelection(link);
}

/**
 * Creates a link to a file in another vault.
 */
function createVaultFileLink(fileDisplayName: string, outputVault: string): string {
    // Get content for link
    const vaultPathArray = cleanPath(outputVault).split("/");
    const vaultName = vaultPathArray[vaultPathArray.length - 1];
    const urlOtherVault = encodeURI(vaultName);
    const urlFile = encodeURI(fileDisplayName);

    return `[${fileDisplayName}](obsidian://vault/${urlOtherVault}/${urlFile})`;
}

/**
 * Ensures necessary info has been set in plugin settings.
 * @returns True if an error was shown, otherwise false.
 */
function showErrorIfSettingsInvalid(settings: VaultTransferSettings): boolean {
    var message: string | null = null;

    // Check settings
    if (settings.outputVault.trim().length == 0) {
        message = "Target vault has not been set.";
    }

    // Show notice, if necessary
    if (message != null) {
        showNotice(`Error: ${message}`);
        return true;
    }

    return false;
}

/**
 * Improves consistency of slashes in a path.
 */
function cleanPath(path: string): string {
    return path.trim()
        // Replace '\' with '/'
        .replaceAll("\\", "/")
        // Remove beginning '/'
        .replace(/^\//, "")
        // Remove end '/'
        .replace(/\/$/, "");
}