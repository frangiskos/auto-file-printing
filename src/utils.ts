import chalk from 'chalk';
import * as fs from 'fs-extra';
import path from 'path';
import { exit, settings } from './config';
// import { path as RootPath } from 'app-root-path';

export function checkIfPathToMonitorExists() {
  if (!fs.existsSync(settings.App.PathToMonitor)) {
    exit(
      chalk.blue(
        `Cannot access path to monitor: ${chalk.red(
          settings.App.PathToMonitor,
        )}`,
      ),
    );
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

export function getFilesForPrinting() {
  let files = fs.readdirSync(settings.App.PathToMonitor);
  if (settings.App.FileExtensions?.length > 0) {
    files = files.filter((f) =>
      settings.App.FileExtensions.includes(path.extname(f).toLowerCase()),
    );
  }
  if (settings.App.PrintingFilePrefix.length > 0) {
    files = files.filter((f) => !f.startsWith(settings.App.PrintingFilePrefix));
  }
  return files;
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
