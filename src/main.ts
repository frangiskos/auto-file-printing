import * as path from 'path';
import { exit, settings } from './config';
import {
  checkIfFileExtensionsAreValid,
  checkIfPrinterIsValid,
  checkPathAccess,
  convertFilesToUtf8,
  doCleanup,
  getFilesForPrinting,
  moveFilesToQueue,
  printFile,
  testAllEncodings,
  waitAsync,
} from './utils';

async function main() {
  try {
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
      !settings.Debug.DeleteOriginalAfterPrint ||
      !settings.Debug.DeleteConvertedAfterPrint
    ) {
      checkPathAccess({
        pathToCheck: path.join(settings.App.PrintFolder, 'done'),
        createIfMissing: true,
      });
    }
    checkIfFileExtensionsAreValid();
    const printerName = checkIfPrinterIsValid(
      settings.Debug.ShowAvailablePrintersOnStartup,
    );

    // run printing loop
    const files: string[] = getFilesForPrinting();
    const filesInQueue: string[] = moveFilesToQueue(files);
    const convertedFiles: { original: string; converted: string }[] =
      convertFilesToUtf8(filesInQueue);

    // print files
    for (const file of convertedFiles) {
      const printProcess = await printFile({
        file: file.converted,
        folder: path.join(settings.App.PrintFolder, 'queue'),
        printer: printerName,
      });

      doCleanup(file, printProcess);
      waitAsync(settings.App.PauseBetweenPrints);
    }
  } catch (error) {
    exit(`Unexpected error: ${error}`);
  }
}

main();
