import chalk from 'chalk';
import * as fs from 'fs-extra';
import { Iconv } from 'iconv';
import path from 'path';
import { exit, log, settings } from './config';
import { getDefaultPrinter, getPrinterNames, printFile } from './spawnUtils';

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
            filesMoved.push(newFileName);
        } catch (error) {
            log(chalk.red(`Error moving file ${file} to queue folder`));
        }
    }
    return filesMoved;
}

export function convertFilesToUtf8(files: string[]) {
    const filesProcessed: Array<{ original: string; converted: string }> = [];
    for (const file of files) {
        try {
            log(chalk.blue(`processing file ${chalk.yellow(file)}`));
            const txtBuffer = fs.readFileSync(
                path.join(settings.App.PrintFolder, 'queue', file),
            );
            const iconv = new Iconv('Greek', 'UTF-8');
            const convertedBuffer = iconv.convert(txtBuffer);
            fs.writeFileSync(
                path.join(settings.App.PrintFolder, 'queue', `utf8_` + file),
                convertedBuffer,
                { encoding: 'utf8' },
            );
            filesProcessed.push({ original: file, converted: `utf8_` + file });
        } catch (error) {
            log(chalk.red(`Error processing file ${file}`));
            fs.moveSync(
                path.join(settings.App.PrintFolder, 'queue', file),
                path.join(
                    settings.App.PrintFolder,
                    'queue',
                    `convert_error_` + file,
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
    file: { original: string; converted: string },
    printProcess: Awaited<ReturnType<typeof print>>,
) {
    if (printProcess.success) {
        log(chalk.green(`Printed file ${chalk.yellow(file.original)}`));

        if (settings.Debug.DeleteOriginalAfterPrint) {
            fs.removeSync(
                path.join(settings.App.PrintFolder, 'queue', file.original),
            );
        } else {
            fs.moveSync(
                path.join(settings.App.PrintFolder, 'queue', file.original),
                path.join(settings.App.PrintFolder, 'done', file.original),
            );
        }

        if (settings.Debug.DeleteConvertedAfterPrint) {
            fs.removeSync(
                path.join(settings.App.PrintFolder, 'queue', file.converted),
            );
        } else {
            fs.moveSync(
                path.join(settings.App.PrintFolder, 'queue', file.converted),
                path.join(settings.App.PrintFolder, 'done', file.converted),
            );
        }
    } else {
        log(chalk.red(`Error printing file ${chalk.yellow(file.converted)}`));
        fs.moveSync(
            path.join(settings.App.PrintFolder, 'queue', file.converted),
            path.join(settings.App.PrintFolder, 'queue', 'print_error_' + file),
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
    const txtBuffer = fs.readFileSync(testFilePath);

    const supportedEncodings = fs.readJSONSync(
        path.join(__dirname, '..', 'encodings.json'), // e.g. ['CP737', 'ISO-8859-7'];
    );
    const matchingEncodings = [];
    for (const encoding of supportedEncodings) {
        try {
            const iconv = new Iconv(encoding, 'UTF-8');
            const convertedBuffer = iconv.convert(txtBuffer);
            const converted = convertedBuffer.toString('utf8');
            const convertedLines = converted.split('\r\n');
            const linesWithName = convertedLines.filter((line) =>
                line.includes(expected),
            );
            if (linesWithName.length > 0) {
                log(chalk.green(encoding), linesWithName[0]);
                matchingEncodings.push(encoding);
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
