import printer from '@thiagoelg/node-printer';
import chalk from 'chalk';
import { spawn } from 'child_process';
import * as fs from 'fs-extra';
import { Iconv } from 'iconv';
import path from 'path';
import { exit, log, settings } from './config';
// import { path as RootPath } from 'app-root-path';

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
    exit(chalk.blue(`Need full access to the path: ${chalk.red(pathToCheck)}`));
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

export function checkIfPrinterIsValid(showAvailablePrinters: boolean) {
  const printers = printer.getPrinters();
  const defaultPrinter = printer.getDefaultPrinterName();
  const availablePrinters = printers
    .map((p) => ({
      name: p.name,
      default: p.name === defaultPrinter,
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
      fs.moveSync(
        path.join(settings.App.PrintFolder, file),
        path.join(settings.App.PrintFolder, 'queue', file),
        { overwrite: true },
      );
      filesMoved.push(file);
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
        path.join(settings.App.PrintFolder, 'queue', `convert_error_` + file),
        { overwrite: true },
      );
    }
  }
  return filesProcessed;
}

export async function printFile({
  file,
  folder,
  printer,
}: {
  file: string;
  folder: string;
  printer: string;
}): Promise<Record<'success', boolean>> {
  const printProcess = spawn('print', [
    `/d:"${printer}"`,
    path.join(folder, file),
  ]);

  printProcess.stdout.on('data', (data) => {
    log(chalk.green(`stdout: ${data}`));
  });

  printProcess.stderr.on('data', (data) => {
    log(chalk.red(`stderr: ${data}`));
  });

  return new Promise((resolve, reject) => {
    printProcess.on('exit', (code) => {
      if (code === 0) {
        resolve({ success: true });
      } else {
        log(chalk.red(`Printing ${chalk.yellow(file)} failed`));
        reject({ success: false });
      }
    });
  });
}

// async function runCmdLocal(
//   task: TaskRunCmdLocal,
//   configList: App['configList'],
// ) {
//   const config = configList[task.useConfig];
//   const commands = Array.isArray(task.cmd) ? task.cmd : [task.cmd];
//   for (const cmd of commands) {
//     if (cmd.spawnOptions?.cwd === '$CONFIG_PATH') {
//       cmd.spawnOptions.cwd = config.path;
//     }
//     await runProcess(cmd);
//   }
// }

// export async function runProcess({
//   command,
//   args,
//   spawnOptions,
//   shellCommands,
//   message,
// }: LocalCmd): Promise<void> {
//   return new Promise(async (resolve, reject) => {
//     args = args ?? [];
//     shellCommands = shellCommands ?? [];
//     shellCommands = Array.isArray(shellCommands)
//       ? shellCommands
//       : [shellCommands];
//     if (message) {
//       console.log(chalk.blue(message));
//     }

//     const cmd = spawn(command, args, spawnOptions);

//     cmd.on('exit', (exitCode: number) => {
//       if (exitCode === 0) {
//         resolve();
//       } else {
//         reject(`spawn process exited with code ${exitCode}`);
//       }
//     });

//     if (shellCommands) {
//       for (const shellCommand of shellCommands) {
//         if (typeof shellCommand === 'string') {
//           cmd.stdin.write(`${shellCommand}\n`);
//         } else {
//           await new Promise((r) =>
//             setTimeout(
//               () => cmd.stdin.write(`${shellCommand.cmd}\n`),
//               shellCommand.wait,
//             ),
//           );
//         }
//       }
//     }
//   });
// }
