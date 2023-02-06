import chalk from 'chalk';
import * as fs from 'fs-extra';
import * as path from 'path';
import {
  array,
  boolean,
  InferType,
  number,
  object,
  string,
  ValidationError,
} from 'yup';

const isPackagedApp = !process.execPath.endsWith('node.exe');
const basePath = isPackagedApp ? process.cwd() : __dirname;

export const log = console.log;

export const exit = (error: string) => {
  log(chalk.red(error));
  process.exit(1);
};

export const config = {
  isPackagedApp,
  basePath,
};

const settingsSchema = object({
  App: object({
    PathToMonitor: string().required(),
    FileExtensions: array().of(string()).required(),
    PrintingFilePrefix: string().required().min(1),
    DeleteAfterPrint: boolean().required(),
    CheckForNewFilesInterval: number().required(),
    PauseBetweenPrints: number().required(),
  }),
});

export type SettingsValue = InferType<typeof settingsSchema>;

const settingsSample: SettingsValue = {
  App: {
    // PathToMonitor: 'C:\\Users\\user\\Desktop\\',
    PathToMonitor:
      'C:\\DEV\\app\\Kentriki_auto_file_print\\auto-file-printing\\original_files',
    FileExtensions: ['.txt'],
    PrintingFilePrefix: 'printing_',
    DeleteAfterPrint: true,
    CheckForNewFilesInterval: 1000,
    PauseBetweenPrints: 1000,
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
  fs.writeJSONSync(settingsPath.slice(0, -5) + '_sample.json', settingsSample, {
    spaces: 2,
  });
  throw 'Invalid settings.json file';
}

if (!settingsSchema.isValidSync(settings)) {
  log(
    chalk.blue(
      '"settings.json" has invalid or missing options. Creating a sample "settings_sample.json" with default settings. \nRename it to "settings.json" and edit it.',
    ),
  );
  try {
    settingsSchema.validateSync(settings, { abortEarly: false });
  } catch (error) {
    const err = error as ValidationError;
    err.inner.forEach(({ path, message }) => {
      log(
        chalk.blue(`Error at ${chalk.bgRed(path)}: ${chalk.yellow(message)}`),
      );
    });
  }

  fs.writeJSONSync(settingsPath.slice(0, -5) + '_sample.json', settingsSample, {
    spaces: 2,
  });
  throw 'Invalid settings.json file';
}
