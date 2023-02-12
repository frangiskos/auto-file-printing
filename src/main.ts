import chalk from 'chalk';
import * as path from 'path';
import { exit, log, settings } from './config';
import {
    checkIfFileExtensionsAreValid,
    checkIfPrinterIsValid,
    checkPathAccess,
    convertFilesToUtf8,
    doCleanup,
    getFilesForPrinting,
    moveFilesToQueue,
    print,
    testAllEncodings,
    waitAsync,
} from './utils';

async function main() {
    try {
        // Demo version. Add expiration date after 30 days
        const demoExpirationDate = new Date('2023-03-31T01:00:00');
        const currentDate = new Date();
        if (currentDate.getTime() > demoExpirationDate.getTime()) {
            exit(`Demo version expired. Please contact the developer`);
        }

        // check if we need to run the encoding test
        if (settings.FindEncoding.RunFindEncodingProcess) {
            testAllEncodings(
                settings.FindEncoding.TestFile,
                settings.FindEncoding.ExpectedCorrectText,
            );
            return;
        }

        // run some checks first
        checkPathAccess({ pathToCheck: settings.App.PrintFolder });
        checkPathAccess({
            pathToCheck: path.join(settings.App.PrintFolder, 'queue'),
            createIfMissing: true,
        });
        if (
            !settings.App.DeleteOriginalAfterPrint ||
            !settings.App.DeleteConvertedAfterPrint
        ) {
            checkPathAccess({
                pathToCheck: path.join(settings.App.PrintFolder, 'done'),
                createIfMissing: true,
            });
        }
        checkIfFileExtensionsAreValid();
        const printerName = await checkIfPrinterIsValid(
            settings.App.ShowAvailablePrintersOnStartup,
        );

        // run printing loop
        log(chalk.green('Checking for new files...'));
        // eslint-disable-next-line no-constant-condition
        while (true) {
            const files: string[] = getFilesForPrinting();
            const filesInQueue: { original: string; inQueue: string }[] =
                moveFilesToQueue(files);

            // Convert files to utf8
            let convertedFiles: {
                original: string;
                inQueue: string;
                converted: string;
            }[] = [];
            if (settings.App.ConvertFiles) {
                convertedFiles = convertFilesToUtf8(filesInQueue);
            } else {
                convertedFiles = filesInQueue.map((file) => ({
                    original: file.original,
                    inQueue: file.inQueue,
                    converted: file.inQueue,
                }));
            }

            // print files
            for (const file of convertedFiles) {
                if (!settings.App.PrintFiles) {
                    doCleanup(file, { success: true });
                    continue;
                }

                const printProcess = await print({
                    file: file.converted,
                    folder: path.join(settings.App.PrintFolder, 'queue'),
                    printerName,
                });

                doCleanup(file, printProcess);
                await waitAsync(settings.App.PauseBetweenPrints);
            }
            await waitAsync(settings.App.PauseBetweenChecks);
        }
    } catch (error) {
        exit(`Unexpected error: ${error}`);
    }
}

main();
