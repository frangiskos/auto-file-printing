"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.printFile = exports.getDefaultPrinter = exports.getPrinterNames = void 0;
const chalk_1 = __importDefault(require("chalk"));
const child_process_1 = require("child_process");
const config_1 = require("./config");
async function spawnCmd({ process, args, }) {
    return new Promise((resolve) => {
        const spawnProcess = (0, child_process_1.spawn)(process, args, { shell: true });
        const processData = [];
        spawnProcess.stdout.on('data', (data) => {
            processData.push(data.toString());
        });
        spawnProcess.stderr.on('data', (data) => {
            (0, config_1.log)(chalk_1.default.red(`stderr: ${data}`));
            // resolve({ success: false, error: processData });
        });
        spawnProcess.on('exit', (code) => {
            if (code === 0) {
                resolve({
                    success: true,
                    data: processData.join('').split('\r\n'),
                });
            }
            else {
                (0, config_1.log)(chalk_1.default.red(`Process execution failed`));
                resolve({ success: false, error: processData });
            }
        });
    });
}
async function execCmd({ process, args, }) {
    return new Promise((resolve) => {
        (0, child_process_1.execFile)(process, args, {
            encoding: 'utf8',
            windowsHide: true,
        }, (error, stdout) => {
            if (error) {
                resolve({ success: false, error });
            }
            else {
                resolve({
                    success: true,
                    data: stdout.split('\r\n'),
                });
            }
        });
        // console.log('execFile spawn');
        // console.log(execProcess.spawnfile);
        // execProcess.on('error', (err) => {
        //     // Error
        //       console.log(`execFile on error:${err}`);
        //   });
        // execProcess.on('close', (code: number, args: any[]) => {
        //     // Success
        //       console.log(`execFile on close code: ${code} args: ${args}`);
        //   });
    });
}
async function getPrinterNames() {
    const result = await spawnCmd({
        process: 'powershell.exe',
        args: [
            '-noprofile',
            '-executionpolicy',
            'bypass',
            '-c',
            'Get-WmiObject',
            'Win32_Printer',
        ],
    });
    if (!result.success) {
        (0, config_1.log)(chalk_1.default.red(`Failed to get printer names. Make sure you have at least 1 printer installed and that the current windows user can run powershell commands. Error: ${result.error}`));
        return [];
    }
    const printerNames = result.data
        .map((line) => line.split(':'))
        .filter((line) => line[0].trim() === 'Name')
        .map((line) => line[1].trim());
    return printerNames;
}
exports.getPrinterNames = getPrinterNames;
async function getDefaultPrinter() {
    const data = await execCmd({
        process: 'powershell.exe',
        args: [
            '-noprofile',
            '-executionpolicy',
            'bypass',
            '-Command',
            'Get-CimInstance -ClassName CIM_Printer | WHERE {$_.Default -eq $True}[0] |select Name',
        ],
    });
    if (!data.success) {
        (0, config_1.log)(chalk_1.default.red(`Failed to get default printer. Make sure you have at least 1 printer installed and that the current windows user can run powershell commands. Error: ${data.error}`));
        return null;
    }
    const defaultPrinter = data.data
        .filter((line) => line.trim().length > 0)
        .reverse()[0];
    return defaultPrinter ? defaultPrinter.trim() : null;
}
exports.getDefaultPrinter = getDefaultPrinter;
async function printFile({ filePath, printerName, }) {
    const data = await execCmd({
        process: config_1.settings.App.PrintCommand,
        args: config_1.settings.App.PrintCommandArgs.map((arg) => arg
            .replace('%FILE_PATH%', filePath)
            .replace('%PRINTER_NAME%', printerName))
            .map((arg) => String.raw `${arg.trim()}`)
            .filter((arg) => arg.length > 0),
    });
    return data;
}
exports.printFile = printFile;
