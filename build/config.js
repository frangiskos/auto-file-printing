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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.settings = exports.config = exports.exit = exports.log = void 0;
const chalk_1 = __importDefault(require("chalk"));
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const yup_1 = require("yup");
const isPackagedApp = !process.execPath.endsWith('node.exe');
const basePath = isPackagedApp ? process.cwd() : __dirname;
exports.log = console.log;
const exit = (error) => {
    (0, exports.log)(chalk_1.default.red(error));
    process.exit(1);
};
exports.exit = exit;
exports.config = {
    isPackagedApp,
    basePath,
};
const settingsSchema = (0, yup_1.object)({
    App: (0, yup_1.object)({
        PrintFolder: (0, yup_1.string)().required(),
        FileExtensions: (0, yup_1.array)().of((0, yup_1.string)()).required(),
        PrinterName: (0, yup_1.string)().required(),
        CheckForNewFilesInterval: (0, yup_1.number)().required(),
        PauseBetweenPrints: (0, yup_1.number)().required(),
    }).required(),
    Debug: (0, yup_1.object)({
        DeleteOriginalAfterPrint: (0, yup_1.boolean)().required(),
        DeleteConvertedAfterPrint: (0, yup_1.boolean)().required(),
        ShowAvailablePrintersOnStartup: (0, yup_1.boolean)().required(),
    }).required(),
});
const settingsSample = {
    App: {
        PrintFolder: 'C:\\DEV\\app\\Kentriki_auto_file_print\\auto-file-printing\\original_files',
        FileExtensions: ['.txt'],
        PrinterName: 'Microsoft Print to PDF',
        CheckForNewFilesInterval: 1000,
        PauseBetweenPrints: 1000,
    },
    Debug: {
        DeleteOriginalAfterPrint: false,
        DeleteConvertedAfterPrint: false,
        ShowAvailablePrintersOnStartup: true,
    },
};
const settingsPath = path.join(exports.config.basePath, exports.config.isPackagedApp ? '' : '..', 'settings.json');
if (!fs.existsSync(settingsPath)) {
    fs.writeJSONSync(settingsPath, settingsSample, { spaces: 2 });
}
exports.settings = fs.readJSONSync(settingsPath, {
    throws: false,
});
if (!exports.settings) {
    (0, exports.log)(chalk_1.default.blue('"settings.json" is not a valid JSON file. Creating a sample "settings_sample.json" with default settings. \nRename it to "settings.json" and edit it.'));
    fs.writeJSONSync(settingsPath.slice(0, -5) + '_sample.json', settingsSample, {
        spaces: 2,
    });
    throw 'Invalid settings.json file';
}
if (!settingsSchema.isValidSync(exports.settings)) {
    (0, exports.log)(chalk_1.default.blue('"settings.json" has invalid or missing options. Creating a sample "settings_sample.json" with default settings. \nRename it to "settings.json" and edit it.'));
    try {
        settingsSchema.validateSync(exports.settings, { abortEarly: false });
    }
    catch (error) {
        const err = error;
        err.inner.forEach(({ path, message }) => {
            (0, exports.log)(chalk_1.default.blue(`Error at ${chalk_1.default.bgRed(path)}: ${chalk_1.default.yellow(message)}`));
        });
    }
    fs.writeJSONSync(settingsPath.slice(0, -5) + '_sample.json', settingsSample, {
        spaces: 2,
    });
    throw 'Invalid settings.json file';
}
