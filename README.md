# About

A CLI tool to print files from a folder. The files are converted to UTF8 before printing.

## How it works

Monitors a folder for new files. The path of the folder and file extension is configurable in settings.json.

- When new files are found, they are moved them to a ./queue subfolder.
- Then, for each file in queue:
  - we read the file content
  - convert it to UTF8
  - save it as utf8\_[filename]
  - send it to the printer
  - move the original file and the file with the utf8\_ prefix to a ./done subfolder, or delete them if the setting is set to true.

## Configuration

The extension is configured in settings.json. The following settings are available:

### App Settings

- "PrintFolder": the path of the folder to monitor. Note that the character "\" must be escaped with another "\". For example, "C:\\Users\\myuser\\Desktop\\printfolder" is a valid path.
- "FileExtensions": the file extensions to monitor. Example: [".txt"]. Leave blank to monitor for all files. Note that only text files are supported.
- "PrinterName": the name of the printer to use. If not set, the default printer is used. If an invalid printer name is set, the app will show a list of all available printers and exit.
- "CheckForNewFilesInterval": the interval in milliseconds to check for new files in the folder
- "PauseBetweenPrints": the interval in milliseconds to wait between each print

### Debug Settings

- "DeleteOriginalAfterPrint": if true, the original file is deleted after printing. If false, they are moved to a ./done subfolder.
- "DeleteConvertedAfterPrint": if true, the file with the utf8\_ prefix is deleted after printing. If false, they are moved to a ./done subfolder.
- "ShowAvailablePrintersOnStartup": if true, the list of available printers is shown on startup.
