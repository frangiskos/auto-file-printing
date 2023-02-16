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
exports.testAllEncodings = exports.doCleanup = exports.print = exports.convertFilesToUtf8 = exports.moveFilesToQueue = exports.getFilesForPrinting = exports.checkIfPrinterIsValid = exports.checkIfFileExtensionsAreValid = exports.checkPathAccess = exports.waitAsync = void 0;
const chalk_1 = __importDefault(require("chalk"));
const fs = __importStar(require("fs-extra"));
const iconv_1 = require("iconv");
const path_1 = __importDefault(require("path"));
const config_1 = require("./config");
const spawnUtils_1 = require("./spawnUtils");
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const encodings_json_1 = __importDefault(require("../encodings.json"));
const waitAsync = (ms) => new Promise((r) => setTimeout(r, ms));
exports.waitAsync = waitAsync;
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
async function checkIfPrinterIsValid(showAvailablePrinters) {
    const printers = await (0, spawnUtils_1.getPrinterNames)();
    const defaultPrinter = await (0, spawnUtils_1.getDefaultPrinter)();
    const availablePrinters = printers
        .map((p) => ({
        name: p,
        default: p === defaultPrinter,
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
    let files = fs.readdirSync(config_1.settings.App.PrintFolder);
    if (config_1.settings.App.FileExtensions?.length > 0) {
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
            const timestamp = new Date()
                .toISOString()
                .slice(0, -1)
                .replaceAll('-', '_')
                .replaceAll(':', '_')
                .replaceAll('.', '_');
            const newFileName = timestamp + '_' + file;
            fs.moveSync(path_1.default.join(config_1.settings.App.PrintFolder, file), path_1.default.join(config_1.settings.App.PrintFolder, 'queue', newFileName), { overwrite: true });
            filesMoved.push({ original: file, inQueue: newFileName });
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
            (0, config_1.log)(chalk_1.default.blue(`processing file ${chalk_1.default.yellow(file.original)}`));
            const txtBuffer = fs.readFileSync(path_1.default.join(config_1.settings.App.PrintFolder, 'queue', file.inQueue));
            if (txtBuffer[0] === 0xef &&
                txtBuffer[1] === 0xbb &&
                txtBuffer[2] === 0xbf) {
                (0, config_1.log)(chalk_1.default.blue(`file ${chalk_1.default.yellow(file.original)} is already utf8`));
                filesProcessed.push({
                    original: file.original,
                    inQueue: file.inQueue,
                    converted: file.inQueue,
                });
                continue;
            }
            const iconv = new iconv_1.Iconv(config_1.settings.App.SourceFileEncoding, 'UTF-8');
            const convertedBuffer = iconv.convert(txtBuffer);
            fs.writeFileSync(path_1.default.join(config_1.settings.App.PrintFolder, 'queue', `utf8_` + file.inQueue), 
            // convertedBuffer,
            '\ufeff' + convertedBuffer, // \ufeff is the BOM
            { encoding: 'utf8' });
            filesProcessed.push({
                original: file.original,
                inQueue: file.inQueue,
                converted: `utf8_` + file.inQueue,
            });
        }
        catch (error) {
            (0, config_1.log)(chalk_1.default.red(`Error processing file ${file.inQueue}`));
            (0, config_1.log)(chalk_1.default.red(error));
            fs.moveSync(path_1.default.join(config_1.settings.App.PrintFolder, 'queue', file.inQueue), path_1.default.join(config_1.settings.App.PrintFolder, 'queue', `convert_error_` + file.inQueue), { overwrite: true });
        }
    }
    return filesProcessed;
}
exports.convertFilesToUtf8 = convertFilesToUtf8;
async function print({ file, folder, printerName, }) {
    const printProcess = await (0, spawnUtils_1.printFile)({
        filePath: path_1.default.join(folder, file),
        printerName,
    });
    if (!printProcess.success) {
        (0, config_1.log)(chalk_1.default.red(`Printing ${chalk_1.default.yellow(file)} failed. Error: ${printProcess.error}`));
    }
    return printProcess.success ? { success: true } : { success: false };
}
exports.print = print;
function doCleanup(file, printProcess) {
    if (printProcess.success) {
        (0, config_1.log)(chalk_1.default.green(`Printed file ${chalk_1.default.yellow(file.original)}`));
        const fileInQueue = path_1.default.join(config_1.settings.App.PrintFolder, 'queue', file.inQueue);
        const fileInQueueMoved = path_1.default.join(config_1.settings.App.PrintFolder, 'done', file.inQueue);
        if (fs.existsSync(fileInQueue)) {
            config_1.settings.App.DeleteOriginalAfterPrint
                ? fs.removeSync(fileInQueue)
                : fs.moveSync(fileInQueue, fileInQueueMoved);
        }
        const fileConverted = path_1.default.join(config_1.settings.App.PrintFolder, 'queue', file.converted);
        const fileConvertedMoved = path_1.default.join(config_1.settings.App.PrintFolder, 'done', file.converted);
        if (fs.existsSync(fileConverted)) {
            config_1.settings.App.DeleteConvertedAfterPrint
                ? fs.removeSync(fileConverted)
                : fs.moveSync(fileConverted, fileConvertedMoved);
        }
    }
    else {
        (0, config_1.log)(chalk_1.default.red(`Error printing file ${chalk_1.default.yellow(file.converted)}`));
        fs.moveSync(path_1.default.join(config_1.settings.App.PrintFolder, 'queue', file.converted), path_1.default.join(config_1.settings.App.PrintFolder, 'queue', 'print_error_' + file.converted));
    }
}
exports.doCleanup = doCleanup;
async function testAllEncodings(testFilePath, expected, { logUnsupportedEncodings, logNonMatchingEncodings, } = {
    logUnsupportedEncodings: false,
    logNonMatchingEncodings: false,
}) {
    // const testFile = path.join(settings.App.PrintFolder, 'test2.txt'); // CP737
    // const testFile = path.join(settings.App.PrintFolder, 'Greek-test1.txt'); // ISO-8859-7 OR GREEK
    if (!fs.existsSync(testFilePath)) {
        (0, config_1.exit)(`Test file ${chalk_1.default.blue(testFilePath)} does not exist`);
        return;
    }
    const txtBuffer = fs.readFileSync(testFilePath);
    // const encodingsFilePath = config.isPackagedApp
    //     ? path.join(config.basePath, 'encodings.json')
    //     : path.join(config.basePath, '..', 'encodings.json'); // e.g. ['CP737', 'ISO-8859-7'];
    // const supportedEncodings = fs.readJSONSync(encodingsFilePath);
    // const supportedEncodings = JSON.stringify(
    //     require('iconv-lite/encodings'),
    // ).split(',');
    const supportedEncodings = encodings_json_1.default;
    // console.log(
    //     '🚀 ~ file: utils.ts:315 ~ supportedEncodings',
    //     supportedEncodings,
    // );
    const matchingEncodings = [];
    for (const encoding of supportedEncodings) {
        try {
            const iconv = new iconv_1.Iconv(encoding, 'UTF-8');
            const convertedBuffer = iconv.convert(txtBuffer);
            const converted = convertedBuffer.toString('utf8');
            const convertedLines = converted.split('\r\n');
            const linesWithName = convertedLines.filter((line) => line.includes(expected));
            if (linesWithName.length > 0) {
                (0, config_1.log)(chalk_1.default.green(encoding), linesWithName[0]);
                matchingEncodings.push(encoding);
                const convertedFilename = testFilePath.slice(0, testFilePath.lastIndexOf('.')) +
                    '_' +
                    encoding +
                    testFilePath.slice(testFilePath.lastIndexOf('.'));
                fs.writeFileSync(convertedFilename, converted);
            }
            else {
                if (logNonMatchingEncodings) {
                    (0, config_1.log)(chalk_1.default.yellow(encoding));
                }
            }
        }
        catch (error) {
            if (logUnsupportedEncodings) {
                (0, config_1.log)(chalk_1.default.red(encoding));
            }
        }
    }
    if (matchingEncodings.length === 0) {
        (0, config_1.log)(chalk_1.default.red('No matching encodings found'));
    }
    else {
        (0, config_1.log)(chalk_1.default.green('Matching encodings found:'), matchingEncodings.join(', '));
    }
}
exports.testAllEncodings = testAllEncodings;
