import chalk from 'chalk';
import * as fs from 'fs-extra';
import { Iconv } from 'iconv';
import * as path from 'path';

import { settings } from './config';
import {
  checkIfFileExtensionsAreValid,
  checkIfPathToMonitorExists,
  getFilesForPrinting,
} from './utils';

async function main() {
  checkIfPathToMonitorExists();
  checkIfFileExtensionsAreValid();
  const files = getFilesForPrinting();

  console.log(files);

  for (const file of files) {
    console.log(chalk.red(file));
    const txtBuffer = fs.readFileSync(
      path.join(settings.App.PathToMonitor, file),
    );
    const iconv = new Iconv('Greek', 'UTF-8');
    const convertedBuffer = iconv.convert(txtBuffer);

    console.log(convertedBuffer.toString());
  }
}

main();
