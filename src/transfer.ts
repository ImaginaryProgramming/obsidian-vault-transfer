import * as fs from 'fs';
import { App, Editor, FileSystemAdapter, MarkdownView, TFile, TFolder, normalizePath } from 'obsidian';
import { VaultTransferSettings } from 'settings';
import { showNotice } from 'utils';

/**
 * Simple function that remove a part of a path using the settings "removePath"
 * @param settings {VaultTransferSettings} 
 * @param path {string}
 * @returns {string} The path without the parts to remove or the original path, depending on the settings
 */
function removePartOfPath(settings: VaultTransferSettings, path: string): string {
    for (const part of settings.removePath) {
        path = path.replace(RegExp(part, "gi"), "");
    }
    return normalizePath(path);
}

/**
 * Copies the content of the current note to another vault, then replaces existing note contents with a link to the new file.
 */
export async function transferNote(editor: Editor | null, file: TFile, app: App, settings: VaultTransferSettings, recursive?: boolean, outputPath?: string) {
    try {
        // Check settings
        const settingsErrorShown = showErrorIfSettingsInvalid(settings);
        if (settingsErrorShown) {
            return;
        }

        const outputVault = normalizePath(settings.outputVault);
        const outputFolder = normalizePath(settings.outputFolder);

        // Get paths
        const fileSystemAdapter = app.vault.adapter;
        if (!(fileSystemAdapter instanceof FileSystemAdapter)) {
            showNotice("Error: fileSystemAdapter is not an instance of FileSystemAdapter");
            return;
        }

        const thisVaultPath = fileSystemAdapter.getBasePath();
        const fileName = file.name;
        const fileDisplayName = file.basename;
        let outputFolderPath: string;
        if (!outputPath) {
            outputFolderPath = `${outputVault}/${outputFolder}`;
            outputPath = normalizePath(`${outputFolderPath}/${fileName}`);
            if (settings.recreateTree) {
                outputPath = normalizePath(`${outputFolderPath}/${file.path}`);
                outputPath = removePartOfPath(settings, outputPath);
            }
        } else {
            outputFolderPath = normalizePath(outputPath);
            outputPath = normalizePath(`${outputPath}/${fileName}`);
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

        // Check if the tag to assign already exists and remove it before copying 
        // (during Overwrite when a note is transferred more than once)
        if (!settings.deleteOriginal && settings.tagToAssign != "") {
          await removeTagFromNote(app, file, settings.tagToAssign);
        }

        //get list of all attachments
        copyAllAttachments(file, app, outputPath, thisVaultPath);
        // Copy to new file in other vault
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

        // If a tag to assign was specified in settings, assign it to the original note
        if (!settings.deleteOriginal && settings.tagToAssign != "") {
            assignTagToNote(app, file, settings.tagToAssign);
        };
    }
    catch (e) {
        showNotice(`Error copying file`, e);
    }
}

/**
 * Generate a list of all files in a folder (including subfolders)
 * @param file {TFolder} The folder to get files from
 * @returns {TFile[]} A list of all TFiles files in the folder
 */
function listToTransfer(file: TFolder) {
    const files = file.children;
    const filesToTransfer: TFile[] = [];
    //recursive function to get all files in folder
    for (const file of files) {
        if (file instanceof TFile) {
            filesToTransfer.push(file);
        } else if (file instanceof TFolder) {
            filesToTransfer.push(...listToTransfer(file));
        }
    }
    return filesToTransfer;
}

/**
 * Transfer a folder and all its contents to another vault
 * @param folder {TFolder} The folder to transfer
 * @param app {App} Obsidian app
 * @param settings {VaultTransferSettings} Plugin settings
 */
export function transferFolder(folder: TFolder, app: App, settings: VaultTransferSettings, outputPath?: string) {
    const files = listToTransfer(folder);
    for (const file of files) {
        transferNote(null, file, app, settings, true, outputPath);
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

    if (view.file == null) {
        showNotice("Error: view.file is null");
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
 * Copy all attachments of a file to a new vault -- Respecting the folder structure of the attachments
 * @param file {TFile} The file to copy the attachments from
 * @param app {App} Obsidian app
 * @param newVault {string} The path of the new vault, where the attachments should be copied to. 
 * @param thisVaultPath {string} The path of the current vault, where the attachments are located.
 */
function copyAllAttachments(file: TFile, app: App, newVault: string, thisVaultPath: string) {
    //Get all attachments of the file, embedded or linked only (pdf, image, md...)
    const fileData = app.metadataCache.getFileCache(file);
    const attachments = [...(fileData?.embeds || []), ...(fileData?.links || [])];
    for (const attachment of attachments) {
        //copy the attachment to the new vault
        const attachmentPath = app.metadataCache.getFirstLinkpathDest(attachment.link.replace(/#.*/, ""), file.path);
        if (attachmentPath) {
            // Obtain file extension, handle potential missing extension
            const fileName = attachmentPath.path.split('/').pop() || '';
            const fileExtension = fileName.split('.').pop();
            // Skip copying MD files
            if (fileExtension !== 'md') {
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
}

function assignTagToNote(app: App, file: TFile, tagToAssign: string) {
    app.fileManager.processFrontMatter(file, (fm) => {
      if (!fm.tags) {
        fm.tags = new Set([tagToAssign]);
      } else {
        let currentTags = [...fm.tags];
        fm.tags = new Set([...currentTags, tagToAssign]);
      }
    })
}

async function removeTagFromNote(app: App, file: TFile, tagToAssign: string) : Promise<void> {
  await app.fileManager.processFrontMatter(file, (fm) => {
	  let index = fm.tags?.indexOf(tagToAssign);
	  if (index > -1) {
		  fm.tags.splice(index, 1);
	  }
  });
}
