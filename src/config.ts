import chalk from 'chalk';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as z from 'zod';

const isPackagedApp = !process.execPath.endsWith('node.exe');
const basePath = isPackagedApp ? process.cwd() : __dirname;

// eslint-disable-next-line no-console
export const log = console.log;

export const exit = async (error: string) => {
    log(chalk.red(error));
    process.exit(1);
};

export const config = {
    isPackagedApp,
    basePath,
};

const settingsSchema = z.object({
    App: z.object({
        PrintFolder: z.string(),
        FileExtensions: z.array(z.string()),
        SourceFileEncoding: z.string(),
        PrinterName: z.string(),
        PrintCommand: z.string(),
        PrintCommandArgs: z.array(z.string()),
        ConvertFiles: z.boolean(),
        PrintFiles: z.boolean(),
        DeleteOriginalAfterPrint: z.boolean(),
        DeleteConvertedAfterPrint: z.boolean(),
        PauseBetweenChecks: z.number(),
        PauseBetweenPrints: z.number(),
        ShowAvailablePrintersOnStartup: z.boolean(),
        RemoveEndingSpaces: z.boolean(),
        RemoveEndingNewLines: z.boolean(),
        RemoveEscapeCharacters: z.boolean(),
    }),
    FindEncoding: z.object({
        RunFindEncodingProcess: z.boolean(),
        TestFile: z.string(),
        ExpectedCorrectText: z.string(),
    }),
});

export type SettingsValue = z.infer<typeof settingsSchema>;

const settingsSample: SettingsValue = {
    App: {
        PrintFolder: 'C:\\dev\\app\\auto-file-printing\\sample_files',
        FileExtensions: ['.txt'],
        SourceFileEncoding: 'CP737',
        PrintCommand: 'powershell.exe',
        PrintCommandArgs: [
            '-noprofile',
            '-executionpolicy',
            'bypass',
            '-Command',
            'Start-Process -WindowStyle Minimized -FilePath "\'"%FILE_PATH%"\'" -Verb print -Wait "\'"%PRINTER_NAME%"\'"',
        ],
        PrinterName: 'Enter printer name here',
        ConvertFiles: true,
        PrintFiles: true,
        DeleteOriginalAfterPrint: false,
        DeleteConvertedAfterPrint: false,
        PauseBetweenChecks: 1000,
        PauseBetweenPrints: 2000,
        ShowAvailablePrintersOnStartup: false,
        RemoveEndingSpaces: true,
        RemoveEndingNewLines: true,
        RemoveEscapeCharacters: true,
    },
    FindEncoding: {
        RunFindEncodingProcess: false,
        TestFile: 'C:\\dev\\app\\auto-file-printing\\sample_files\\test.txt',
        ExpectedCorrectText: 'ΑΒΓΔΕΖ',
    },
};

const settingsPath = path.join(
    config.basePath,
    config.isPackagedApp ? '' : '..',
    'settings.json',
);

if (!fs.existsSync(settingsPath)) {
    fs.writeJSONSync(settingsPath, settingsSample, { spaces: 2 });
}

export const settings: typeof settingsSample = fs.readJSONSync(settingsPath, {
    throws: false,
});

if (!settings) {
    log(
        chalk.blue(
            '"settings.json" is not a valid JSON file. Creating a sample "settings_sample.json" with default settings. \nRename it to "settings.json" and edit it.',
        ),
    );
    fs.writeJSONSync(
        settingsPath.slice(0, -5) + '_sample.json',
        settingsSample,
        {
            spaces: 2,
        },
    );
    throw 'Invalid settings.json file';
}

const schemaParsing = settingsSchema.safeParse(settings);

if (!schemaParsing.success) {
    log(
        chalk.blue(
            '"settings.json" has invalid or missing options. Creating a sample "settings_sample.json" with default settings. \nRename it to "settings.json" and edit it.',
        ),
    );

    schemaParsing.error.errors.forEach((error) => {
        log(
            chalk.blue(
                `Error at ${chalk.bgRed(error.path.join('.'))}: ${chalk.yellow(
                    error.message,
                )}`,
            ),
        );
    });

    fs.writeJSONSync(
        settingsPath.slice(0, -5) + '_sample.json',
        settingsSample,
        {
            spaces: 2,
        },
    );
    throw 'Invalid settings.json file';
}
