import chalk from 'chalk';
import * as fs from 'fs-extra';
import { Iconv } from 'iconv';
import * as path from 'path';
import { log, settings } from './config';
import {
  checkIfFileExtensionsAreValid,
  checkIfPrinterIsValid,
  checkPathAccess,
  convertFilesToUtf8,
  getFilesForPrinting,
  moveFilesToQueue,
  printFile,
} from './utils';

async function main() {
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

  // Run printing loop
  const files: string[] = getFilesForPrinting();
  const filesInQueue: string[] = moveFilesToQueue(files);
  const convertedFiles: { original: string; converted: string }[] =
    convertFilesToUtf8(filesInQueue);

  // send file to printer
  for (const file of convertedFiles) {
    const printProcess = await printFile({
      file: file.converted,
      folder: path.join(settings.App.PrintFolder, 'queue'),
      printer: printerName,
    });

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
}

// main();

const testFile = path.join(settings.App.PrintFolder, 'test2.txt'); // CP737
// const testFile = path.join(settings.App.PrintFolder, 'Greek-test1.txt'); // ISO-8859-7 OR GREEK
const txtBuffer = fs.readFileSync(testFile);

const supportedEncodings = ['CP737', 'ISO-8859-7'];

for (const encoding of supportedEncodings) {
  try {
    const iconv = new Iconv(encoding, 'UTF-8');
    const convertedBuffer = iconv.convert(txtBuffer);
    const converted = convertedBuffer.toString('utf8');
    const convertedLines = converted.split('\r\n');
    const linesWithName = convertedLines.filter((line) =>
      line.includes('ΑΝΤΩΝΗΣ ΠΟΛΥΔΩΡΟΥ'),
    );
    if (linesWithName.length > 0) {
      log(chalk.green(encoding), linesWithName[0]);
    } else {
      // log(chalk.yellow(encoding));
    }
  } catch (error) {
    // log(chalk.red(encoding));
  }
}
