import chalk from 'chalk';
import * as fs from 'fs-extra';
import { Iconv } from 'iconv';
import path from 'path';
import { exit, log, settings } from './config';
import { getDefaultPrinter, getPrinterNames, printFile } from './spawnUtils';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import encodingsJson from '../encodings.json';
export const waitAsync = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function checkPathAccess({
    pathToCheck,
    createIfMissing,
}: {
    pathToCheck: string;
    createIfMissing?: boolean;
}) {
    if (createIfMissing) {
        fs.ensureDirSync(pathToCheck);
    }

    if (!fs.existsSync(pathToCheck)) {
        exit(chalk.blue(`Cannot access path: ${chalk.red(pathToCheck)}`));
    }
    if (!fs.lstatSync(pathToCheck).isDirectory()) {
        exit(chalk.blue(`Path is not a directory: ${chalk.red(pathToCheck)}`));
    }
    if (!checkAccess()) {
        exit(
            chalk.blue(
                `Need full access to the path: ${chalk.red(pathToCheck)}`,
            ),
        );
    }
    function checkAccess() {
        try {
            fs.accessSync(
                pathToCheck,
                fs.constants.F_OK | fs.constants.R_OK | fs.constants.W_OK,
            );
            return true;
        } catch (e) {
            return false;
        }
    }
}

export function checkIfFileExtensionsAreValid() {
    if (settings.App.FileExtensions.length === 0) {
        exit(
            chalk.blue(
                `No file extensions specified in settings: ${chalk.red(
                    settings.App.FileExtensions.join(', '),
                )}`,
            ),
        );
    }
}

export async function checkIfPrinterIsValid(showAvailablePrinters: boolean) {
    const printers = await getPrinterNames();
    const defaultPrinter = await getDefaultPrinter();
    const availablePrinters = printers
        .map((p) => ({
            name: p,
            default: p === defaultPrinter,
        }))
        .sort((a, b) => (a.default ? -1 : 1));

    if (showAvailablePrinters) {
        log(
            chalk.blue(
                `Available printers:\n ${chalk.yellow(
                    JSON.stringify(availablePrinters, null, 2),
                )}`,
            ),
        );
    }

    if (!printers.length) {
        exit(chalk.red(`No printers found`));
    }

    if (settings.App.PrinterName) {
        const printerExists = availablePrinters.some(
            (p) => p.name === settings.App.PrinterName,
        );
        if (!printerExists) {
            exit(
                chalk.blue(
                    `Printer ${chalk.red(
                        settings.App.PrinterName,
                    )} does not exist. Available printers:\n ${chalk.red(
                        JSON.stringify(availablePrinters, null, 2),
                    )}`,
                ),
            );
        }
        return settings.App.PrinterName;
    }
    return availablePrinters[0].name;
}

export function getFilesForPrinting() {
    let files = fs.readdirSync(settings.App.PrintFolder);
    if (settings.App.FileExtensions?.length > 0) {
        files = files.filter((f) =>
            settings.App.FileExtensions.includes(path.extname(f).toLowerCase()),
        );
    }
    return files;
}

export function moveFilesToQueue(files: string[]) {
    const filesMoved = [];
    for (const file of files) {
        // move file to queue folder
        try {
            const timestamp = new Date()
                .toISOString()
                .slice(0, -1)
                .replaceAll('-', '_')
                .replaceAll(':', '_')
                .replaceAll('.', '_');
            const newFileName = timestamp + '_' + file;
            fs.moveSync(
                path.join(settings.App.PrintFolder, file),
                path.join(settings.App.PrintFolder, 'queue', newFileName),
                { overwrite: true },
            );
            filesMoved.push({ original: file, inQueue: newFileName });
        } catch (error) {
            log(chalk.red(`Error moving file ${file} to queue folder`));
        }
    }
    return filesMoved;
}

export function convertFilesToUtf8(
    files: { original: string; inQueue: string }[],
) {
    const filesProcessed: Array<{
        original: string;
        inQueue: string;
        converted: string;
    }> = [];
    for (const file of files) {
        try {
            log(chalk.blue(`processing file ${chalk.yellow(file.original)}`));
            const txtBuffer = fs.readFileSync(
                path.join(settings.App.PrintFolder, 'queue', file.inQueue),
            );
            if (
                txtBuffer[0] === 0xef &&
                txtBuffer[1] === 0xbb &&
                txtBuffer[2] === 0xbf
            ) {
                log(
                    chalk.blue(
                        `file ${chalk.yellow(file.original)} is already utf8`,
                    ),
                );
                filesProcessed.push({
                    original: file.original,
                    inQueue: file.inQueue,
                    converted: file.inQueue,
                });
                continue;
            }

            const iconv = new Iconv(settings.App.SourceFileEncoding, 'UTF-8');
            const convertedBuffer = iconv.convert(txtBuffer);
            // '\ufeff' + convertedBuffer, // \ufeff is the BOM
            const convertedText = convertedBuffer.toString('utf8');

            const convertedFilename = path.join(
                settings.App.PrintFolder,
                'queue',
                `utf8_` + file.inQueue,
            );
            const cleanedFile = fileTextCleanup(convertedText);
            fs.writeFileSync(convertedFilename, cleanedFile, {
                encoding: 'utf8',
            });

            filesProcessed.push({
                original: file.original,
                inQueue: file.inQueue,
                converted: `utf8_` + file.inQueue,
            });
        } catch (error) {
            log(chalk.red(`Error processing file ${file.inQueue}`));
            log(chalk.red(error));
            fs.moveSync(
                path.join(settings.App.PrintFolder, 'queue', file.inQueue),
                path.join(
                    settings.App.PrintFolder,
                    'queue',
                    `convert_error_` + file.inQueue,
                ),
                { overwrite: true },
            );
        }
    }
    return filesProcessed;
}

export async function print({
    file,
    folder,
    printerName,
}: {
    file: string;
    folder: string;
    printerName: string;
}): Promise<Record<'success', boolean>> {
    const printProcess = await printFile({
        filePath: path.join(folder, file),
        printerName,
    });
    if (!printProcess.success) {
        log(
            chalk.red(
                `Printing ${chalk.yellow(file)} failed. Error: ${
                    printProcess.error
                }`,
            ),
        );
    }
    return printProcess.success ? { success: true } : { success: false };
}

export function doCleanup(
    file: { original: string; inQueue: string; converted: string },
    printProcess: Awaited<ReturnType<typeof print>>,
) {
    if (printProcess.success) {
        log(chalk.green(`Printed file ${chalk.yellow(file.original)}`));

        const fileInQueue = path.join(
            settings.App.PrintFolder,
            'queue',
            file.inQueue,
        );
        const fileInQueueMoved = path.join(
            settings.App.PrintFolder,
            'done',
            file.inQueue,
        );

        if (fs.existsSync(fileInQueue)) {
            settings.App.DeleteOriginalAfterPrint
                ? fs.removeSync(fileInQueue)
                : fs.moveSync(fileInQueue, fileInQueueMoved);
        }

        const fileConverted = path.join(
            settings.App.PrintFolder,
            'queue',
            file.converted,
        );
        const fileConvertedMoved = path.join(
            settings.App.PrintFolder,
            'done',
            file.converted,
        );
        if (fs.existsSync(fileConverted)) {
            settings.App.DeleteConvertedAfterPrint
                ? fs.removeSync(fileConverted)
                : fs.moveSync(fileConverted, fileConvertedMoved);
        }
    } else {
        log(chalk.red(`Error printing file ${chalk.yellow(file.converted)}`));
        fs.moveSync(
            path.join(settings.App.PrintFolder, 'queue', file.converted),
            path.join(
                settings.App.PrintFolder,
                'queue',
                'print_error_' + file.converted,
            ),
        );
    }
}

export async function testAllEncodings(
    testFilePath: string,
    expected: string,
    {
        logUnsupportedEncodings,
        logNonMatchingEncodings,
    }: {
        logUnsupportedEncodings: boolean;
        logNonMatchingEncodings: boolean;
    } = {
        logUnsupportedEncodings: false,
        logNonMatchingEncodings: false,
    },
) {
    // const testFile = path.join(settings.App.PrintFolder, 'test2.txt'); // CP737
    // const testFile = path.join(settings.App.PrintFolder, 'Greek-test1.txt'); // ISO-8859-7 OR GREEK
    if (!fs.existsSync(testFilePath)) {
        exit(`Test file ${chalk.blue(testFilePath)} does not exist`);
        return;
    }

    const txtBuffer = fs.readFileSync(testFilePath);

    // const encodingsFilePath = config.isPackagedApp
    //     ? path.join(config.basePath, 'encodings.json')
    //     : path.join(config.basePath, '..', 'encodings.json'); // e.g. ['CP737', 'ISO-8859-7'];
    // const supportedEncodings = fs.readJSONSync(encodingsFilePath);
    // const supportedEncodings = JSON.stringify(
    //     require('iconv-lite/encodings'),
    // ).split(',');
    const supportedEncodings: string[] = encodingsJson;
    // console.log(
    //     '🚀 ~ file: utils.ts:315 ~ supportedEncodings',
    //     supportedEncodings,
    // );
    const matchingEncodings = [];
    for (const encoding of supportedEncodings) {
        try {
            const iconv = new Iconv(encoding, 'UTF-8');
            const convertedBuffer = iconv.convert(txtBuffer);
            const converted = convertedBuffer.toString('utf8');
            const convertedLines = converted.split('\r\n');
            const linesWithName = convertedLines.filter((line: string) =>
                line.includes(expected),
            );
            if (linesWithName.length > 0) {
                log(chalk.green(encoding), linesWithName[0]);
                matchingEncodings.push(encoding);

                const convertedFilename =
                    testFilePath.slice(0, testFilePath.lastIndexOf('.')) +
                    '_' +
                    encoding +
                    testFilePath.slice(testFilePath.lastIndexOf('.'));
                const cleanedFile = fileTextCleanup(converted);
                fs.writeFileSync(convertedFilename, cleanedFile);
            } else {
                if (logNonMatchingEncodings) {
                    log(chalk.yellow(encoding));
                }
            }
        } catch (error) {
            if (logUnsupportedEncodings) {
                log(chalk.red(encoding));
            }
        }
    }
    if (matchingEncodings.length === 0) {
        log(chalk.red('No matching encodings found'));
    } else {
        log(
            chalk.green('Matching encodings found:'),
            matchingEncodings.join(', '),
        );
    }
}

export function fileTextCleanup(text: string) {
    let lines = text.split('\n');

    // Remove escape characters
    lines = lines.map((line) =>
        settings.App.RemoveEscapeCharacters
            ? line.replace(/\\r\\f/g, '')
            : line.replace(/\\r/g, ''),
    );

    if (settings.App.RemoveEndingSpaces) {
        lines = lines.map((line) => line.trimEnd());
    }
    if (settings.App.RemoveEndingNewLines) {
        while (lines[lines.length - 1] === '' && lines.length > 1) {
            lines.pop();
        }
    }

    return lines.join('\r\n');
}
