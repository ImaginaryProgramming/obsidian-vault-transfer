# Obsidian Vault Transfer

Transfers the contents of the selected note to another vault, then links to it from the original note.

## How to use

1. Set the output vault and (optionally) output folder in the settings tab. You can also configure:
    - To create a link to the transferred note in the original note. If set to `false`, you can allow the plugin to delete the original note.
    - If the file must overwrite an existing file in the target vault.
2. Confirm that the target vault and folder exist.
3. Open the note you want to transfer.
4. Run `Vault Transfer: Transfer current note to other vault`.

![vault-transfer](https://user-images.githubusercontent.com/92801558/212498180-34ed6ddf-9800-4904-b5a8-209be067e992.gif)

It is also possible to transfer multiple notes at once. In this case, the plugin will create a folder with the same name as the original folder, and transfer the notes inside it.

You can also use the file-menu to transfer the folder or note, and you can also send to a specific folder in the target vault, or create a new folder in the target vault, and then transfer the note to it.

## Other commands

**Insert link to current note in other vault**

Inserts a link to the current note in the other vault, without transferring the contents. Used when you know a file with the same name already exists in the other vault.
