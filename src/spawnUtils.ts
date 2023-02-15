import chalk from 'chalk';
import { execFile, spawn } from 'child_process';
import { log, settings } from './config';
import { CmdResponse } from './types';

async function spawnCmd({
    process,
    args,
}: {
    process: string;
    args: string[];
}): Promise<CmdResponse> {
    return new Promise((resolve) => {
        const spawnProcess = spawn(process, args, { shell: true });

        const processData: string[] = [];
        spawnProcess.stdout.on('data', (data) => {
            processData.push(data.toString());
        });

        spawnProcess.stderr.on('data', (data) => {
            log(chalk.red(`stderr: ${data}`));
            // resolve({ success: false, error: processData });
        });

        spawnProcess.on('exit', (code) => {
            if (code === 0) {
                resolve({
                    success: true,
                    data: processData.join('').split('\r\n'),
                });
            } else {
                log(chalk.red(`Process execution failed`));
                resolve({ success: false, error: processData });
            }
        });
    });
}
async function execCmd({
    process,
    args,
}: {
    process: string;
    args: string[];
}): Promise<CmdResponse> {
    return new Promise((resolve) => {
        execFile(
            process,
            args,
            {
                encoding: 'utf8',
                windowsHide: true,
            },
            (error, stdout) => {
                if (error) {
                    resolve({ success: false, error });
                } else {
                    resolve({
                        success: true,
                        data: stdout.split('\r\n'),
                    });
                }
            },
        );

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

export async function getPrinterNames() {
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
        log(
            chalk.red(
                `Failed to get printer names. Make sure you have at least 1 printer installed and that the current windows user can run powershell commands. Error: ${result.error}`,
            ),
        );
        return [];
    }

    const printerNames = result.data
        .map((line) => line.split(':'))
        .filter((line) => line[0].trim() === 'Name')
        .map((line) => line[1].trim());

    return printerNames;
}

export async function getDefaultPrinter() {
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
        log(
            chalk.red(
                `Failed to get default printer. Make sure you have at least 1 printer installed and that the current windows user can run powershell commands. Error: ${data.error}`,
            ),
        );
        return null;
    }

    const defaultPrinter = data.data
        .filter((line) => line.trim().length > 0)
        .reverse()[0];
    return defaultPrinter ? defaultPrinter.trim() : null;
}

export async function printFile({
    filePath,
    printerName,
}: {
    filePath: string;
    printerName: string;
}) {
    const data = await execCmd({
        process: settings.App.PrintCommand,
        args: settings.App.PrintCommandArgs.map((arg) =>
            arg
                .replace('%FILE_PATH%', filePath)
                .replace('%PRINTER_NAME%', printerName),
        ),
    });

    return data;
}
