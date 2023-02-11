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
const z = __importStar(require("zod"));
const isPackagedApp = !process.execPath.endsWith('node.exe');
const basePath = isPackagedApp ? process.cwd() : __dirname;
// eslint-disable-next-line no-console
exports.log = console.log;
const exit = async (error) => {
    (0, exports.log)(chalk_1.default.red(error));
    const waitAsync = (ms) => new Promise((r) => setTimeout(r, ms));
    waitAsync(5000).then((_) => process.exit(1));
};
exports.exit = exit;
exports.config = {
    isPackagedApp,
    basePath,
};
const settingsSchema = z.object({
    App: z.object({
        PrintFolder: z.string(),
        FileExtensions: z.array(z.string()),
        SourceFileEncoding: z.string(),
        DestinationFileEncoding: z.string(),
        PrinterName: z.string(),
        CheckForNewFilesInterval: z.number(),
        PauseBetweenPrints: z.number(),
    }),
    Debug: z.object({
        DeleteOriginalAfterPrint: z.boolean(),
        DeleteConvertedAfterPrint: z.boolean(),
        ShowAvailablePrintersOnStartup: z.boolean(),
    }),
    FindEncoding: z.object({
        RunFindEncodingProcess: z.boolean(),
        TestFile: z.string(),
        ExpectedCorrectText: z.string(),
    }),
});
const settingsSample = {
    App: {
        PrintFolder: 'C:\\dev\\app\\ff\\auto-file-printing\\original_files',
        FileExtensions: ['.txt'],
        SourceFileEncoding: 'CP737',
        DestinationFileEncoding: 'utf8',
        PrinterName: 'Microsoft Print to PDF',
        CheckForNewFilesInterval: 1000,
        PauseBetweenPrints: 1000,
    },
    Debug: {
        DeleteOriginalAfterPrint: false,
        DeleteConvertedAfterPrint: false,
        ShowAvailablePrintersOnStartup: true,
    },
    FindEncoding: {
        RunFindEncodingProcess: true,
        TestFile: 'C:\\dev\\app\\ff\\auto-file-printing\\original_files\\test.txt',
        ExpectedCorrectText: 'Ελληνικά',
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
const schemaParsing = settingsSchema.safeParse(exports.settings);
if (!schemaParsing.success) {
    (0, exports.log)(chalk_1.default.blue('"settings.json" has invalid or missing options. Creating a sample "settings_sample.json" with default settings. \nRename it to "settings.json" and edit it.'));
    schemaParsing.error.errors.forEach((error) => {
        (0, exports.log)(chalk_1.default.blue(`Error at ${chalk_1.default.bgRed(error.path.join('.'))}: ${chalk_1.default.yellow(error.message)}`));
    });
    fs.writeJSONSync(settingsPath.slice(0, -5) + '_sample.json', settingsSample, {
        spaces: 2,
    });
    throw 'Invalid settings.json file';
}
