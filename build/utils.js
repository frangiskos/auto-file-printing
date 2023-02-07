"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.printFile = exports.convertFilesToUtf8 = exports.moveFilesToQueue = exports.getFilesForPrinting = exports.checkIfPrinterIsValid = exports.checkIfFileExtensionsAreValid = exports.checkPathAccess = void 0;
const node_printer_1 = __importDefault(require("@thiagoelg/node-printer"));
const chalk_1 = __importDefault(require("chalk"));
const child_process_1 = require("child_process");
const fs = __importStar(require("fs-extra"));
const iconv_1 = require("iconv");
const path_1 = __importDefault(require("path"));
const config_1 = require("./config");
// import { path as RootPath } from 'app-root-path';
function checkPathAccess({ pathToCheck, createIfMissing, }) {
    if (createIfMissing) {
        fs.ensureDirSync(pathToCheck);
    }
    if (!fs.existsSync(pathToCheck)) {
        (0, config_1.exit)(chalk_1.default.blue(`Cannot access path: ${chalk_1.default.red(pathToCheck)}`));
    }
    if (!fs.lstatSync(pathToCheck).isDirectory()) {
        (0, config_1.exit)(chalk_1.default.blue(`Path is not a directory: ${chalk_1.default.red(pathToCheck)}`));
    }
    if (!checkAccess()) {
        (0, config_1.exit)(chalk_1.default.blue(`Need full access to the path: ${chalk_1.default.red(pathToCheck)}`));
    }
    function checkAccess() {
        try {
            fs.accessSync(pathToCheck, fs.constants.F_OK | fs.constants.R_OK | fs.constants.W_OK);
            return true;
        }
        catch (e) {
            return false;
        }
    }
}
exports.checkPathAccess = checkPathAccess;
function checkIfFileExtensionsAreValid() {
    if (config_1.settings.App.FileExtensions.length === 0) {
        (0, config_1.exit)(chalk_1.default.blue(`No file extensions specified in settings: ${chalk_1.default.red(config_1.settings.App.FileExtensions.join(', '))}`));
    }
}
exports.checkIfFileExtensionsAreValid = checkIfFileExtensionsAreValid;
function checkIfPrinterIsValid(showAvailablePrinters) {
    const printers = node_printer_1.default.getPrinters();
    const defaultPrinter = node_printer_1.default.getDefaultPrinterName();
    const availablePrinters = printers
        .map((p) => ({
        name: p.name,
        default: p.name === defaultPrinter,
    }))
        .sort((a, b) => (a.default ? -1 : 1));
    if (showAvailablePrinters) {
        (0, config_1.log)(chalk_1.default.blue(`Available printers:\n ${chalk_1.default.yellow(JSON.stringify(availablePrinters, null, 2))}`));
    }
    if (!printers.length) {
        (0, config_1.exit)(chalk_1.default.red(`No printers found`));
    }
    if (config_1.settings.App.PrinterName) {
        const printerExists = availablePrinters.some((p) => p.name === config_1.settings.App.PrinterName);
        if (!printerExists) {
            (0, config_1.exit)(chalk_1.default.blue(`Printer ${chalk_1.default.red(config_1.settings.App.PrinterName)} does not exist. Available printers:\n ${chalk_1.default.red(JSON.stringify(availablePrinters, null, 2))}`));
        }
        return config_1.settings.App.PrinterName;
    }
    return availablePrinters[0].name;
}
exports.checkIfPrinterIsValid = checkIfPrinterIsValid;
function getFilesForPrinting() {
    var _a;
    let files = fs.readdirSync(config_1.settings.App.PrintFolder);
    if (((_a = config_1.settings.App.FileExtensions) === null || _a === void 0 ? void 0 : _a.length) > 0) {
        files = files.filter((f) => config_1.settings.App.FileExtensions.includes(path_1.default.extname(f).toLowerCase()));
    }
    return files;
}
exports.getFilesForPrinting = getFilesForPrinting;
function moveFilesToQueue(files) {
    const filesMoved = [];
    for (const file of files) {
        // move file to queue folder
        try {
            fs.moveSync(path_1.default.join(config_1.settings.App.PrintFolder, file), path_1.default.join(config_1.settings.App.PrintFolder, 'queue', file), { overwrite: true });
            filesMoved.push(file);
        }
        catch (error) {
            (0, config_1.log)(chalk_1.default.red(`Error moving file ${file} to queue folder`));
        }
    }
    return filesMoved;
}
exports.moveFilesToQueue = moveFilesToQueue;
function convertFilesToUtf8(files) {
    const filesProcessed = [];
    for (const file of files) {
        try {
            (0, config_1.log)(chalk_1.default.blue(`processing file ${chalk_1.default.yellow(file)}`));
            const txtBuffer = fs.readFileSync(path_1.default.join(config_1.settings.App.PrintFolder, 'queue', file));
            const iconv = new iconv_1.Iconv('Greek', 'UTF-8');
            const convertedBuffer = iconv.convert(txtBuffer);
            fs.writeFileSync(path_1.default.join(config_1.settings.App.PrintFolder, 'queue', `utf8_` + file), convertedBuffer, { encoding: 'utf8' });
            filesProcessed.push({ original: file, converted: `utf8_` + file });
        }
        catch (error) {
            (0, config_1.log)(chalk_1.default.red(`Error processing file ${file}`));
            fs.moveSync(path_1.default.join(config_1.settings.App.PrintFolder, 'queue', file), path_1.default.join(config_1.settings.App.PrintFolder, 'queue', `convert_error_` + file), { overwrite: true });
        }
    }
    return filesProcessed;
}
exports.convertFilesToUtf8 = convertFilesToUtf8;
function printFile({ file, folder, printer, }) {
    return __awaiter(this, void 0, void 0, function* () {
        const printProcess = (0, child_process_1.spawn)('print', [
            `/d:"${printer}"`,
            path_1.default.join(folder, file),
        ]);
        printProcess.stdout.on('data', (data) => {
            (0, config_1.log)(chalk_1.default.green(`stdout: ${data}`));
        });
        printProcess.stderr.on('data', (data) => {
            (0, config_1.log)(chalk_1.default.red(`stderr: ${data}`));
        });
        return new Promise((resolve, reject) => {
            printProcess.on('exit', (code) => {
                if (code === 0) {
                    resolve({ success: true });
                }
                else {
                    (0, config_1.log)(chalk_1.default.red(`Printing ${chalk_1.default.yellow(file)} failed`));
                    reject({ success: false });
                }
            });
        });
    });
}
exports.printFile = printFile;
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
