import * as fs from 'fs';
import { App, Editor, FileSystemAdapter, MarkdownView, TFile, TFolder, normalizePath } from 'obsidian';
import { VaultTransferSettings } from 'settings';
import { showNotice } from 'utils';

/**
 * Copies the content of the current note to another vault, then replaces existing note contents with a link to the new file.
 */
export async function transferNote(editor: Editor | null, file: TFile, app: App, settings: VaultTransferSettings, recursive?: boolean) {
    try {
        // Check settings
        const settingsErrorShown = showErrorIfSettingsInvalid(settings);
        if (settingsErrorShown) {
            return;
        }

        const outputVault = normalizePath(settings.outputVault);
        const outputFolder = normalizePath(settings.outputFolder);

        // Get paths
        const fileSystemAdapter = app.vault.adapter as FileSystemAdapter;
        const thisVaultPath = fileSystemAdapter.getBasePath();
        const fileName = file.name;
        const fileDisplayName = file.basename;
        const outputFolderPath = `${outputVault}/${outputFolder}`;
        let outputPath = normalizePath(`${outputFolderPath}/${fileName}`);
        if (settings.recreateTree) {
            outputPath = normalizePath(`${outputFolderPath}/${file.path}`);
        }
        if (!recursive) showNotice(`Copying ${file.path} to ${outputPath}`);

        // Check if directory exists to avoid error when copying
        const folderExists = fs.existsSync(outputFolderPath);
        if (!folderExists) {
            showNotice(`Error: Directory does not exist at ${outputFolderPath}`);
            return;
        } else if (settings.recreateTree) {
            // create folder if it doesn't exist
            fs.mkdirSync(normalizePath(outputPath.replace(fileName, "")), { recursive: true });
        }

        if (fs.existsSync(outputPath)) {
            if (settings.overwrite) {
                fs.unlinkSync(outputPath);
            }
            else {
                showNotice("Error: File already exists");
                return;
            }
        }

        //get list of all attachments
        copyAllAttachments(file, app, outputPath, thisVaultPath);
        // Copy to new file in other vault
        console.log(normalizePath(`${thisVaultPath}/${file.path}`));
        fs.copyFileSync(normalizePath(`${thisVaultPath}/${file.path}`), outputPath);

        if (settings.createLink) {
        // Replace original file with link
            const link = createVaultFileLink(fileDisplayName, outputVault);
            if (editor) editor.setValue(link);
            else await app.vault.modify(file, link);
        } else if (settings.deleteOriginal && !recursive) {
            // Delete original file
            app.vault.trash(file, settings.moveToSystemTrash);
        }
    }
    catch (e) {
        showNotice(`Error copying file`, e);
    }
}

function listToTransfer(file: TFolder) {
    const files = file.children;
    const filesToTransfer:TFile[] = [];
    //recursive function to get all files in folder
    for (const file of files) {
        if (file instanceof TFile) {
            filesToTransfer.push(file as TFile);
        } else {
            filesToTransfer.push(...listToTransfer(file as TFolder));
        }
    }
    return filesToTransfer;
}


export function transferFolder(folder: TFolder, app: App, settings: VaultTransferSettings) {
    const files = listToTransfer(folder);
    for (const file of files) {
        transferNote(null, file, app, settings, true);
        //delete folder after all files are transferred
        if (settings.deleteOriginal && !settings.createLink) {
            app.vault.trash(folder, settings.moveToSystemTrash);
        }
        showNotice(`Finished copying ${file.path}`);
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
    const vaultPathArray = normalizePath(outputVault).split("/");
    const vaultName = vaultPathArray[vaultPathArray.length - 1];
    const urlOtherVault = encodeURI(vaultName);
    const urlFile = encodeURI(fileDisplayName);

    return `[${fileDisplayName}](obsidian://vault/${urlOtherVault}/${urlFile})`;
}

/**
 * Ensures necessary info has been set in plugin settings, otherwise displays an error notice.
 * @returns True if an error was shown, otherwise false.
 */
function showErrorIfSettingsInvalid(settings: VaultTransferSettings): boolean {
    let message: string | null = null;

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
 * @deprecated The obsidian function "normalizePath" is now available, which does the same thing, in a more robust way.
 * Improves consistency of slashes in a path.
 *
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function cleanPath(path: string): string {
    //normalize path
    return path.trim()
        // Replace '\' with '/'
        .replaceAll("\\", "/")
        // Remove beginning '/'
        .replace(/^\//, "")
        // Remove end '/'
        .replace(/\/$/, "");
}

function copyAllAttachments(file: TFile, app: App, newVault: string, thisVaultPath: string) {
    //Get all attachments of the file, aka embedded things (pdf, image...)
    const attachments = app.metadataCache.getFileCache(file)?.embeds ?? [];
    for (const attachment of attachments) {
        //copy the attachment to the new vault
        const attachmentPath = app.metadataCache.getFirstLinkpathDest(attachment.link.replace(/#.*/, ""), file.path);
        if (attachmentPath) {
            //recreate the path of the attachment in the new vault
            const newAttachmentPath = normalizePath(`${newVault.replace(file.name, "")}/${attachmentPath.path}`);
            const oldAttachmentPath = normalizePath(`${thisVaultPath}/${attachmentPath.path}`);
            //check if the folder exists, if not create it
            if (!fs.existsSync(newAttachmentPath.replace(attachmentPath.name, ""))) {
                //recursively create the folder
                fs.mkdirSync(newAttachmentPath.replace(attachmentPath.name, ""), { recursive: true });
            }
            //copy the attachment
            fs.copyFileSync(oldAttachmentPath, newAttachmentPath);
        }
    }
}