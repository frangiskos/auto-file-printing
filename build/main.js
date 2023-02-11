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
Object.defineProperty(exports, "__esModule", { value: true });
const path = __importStar(require("path"));
const config_1 = require("./config");
const utils_1 = require("./utils");
async function main() {
    try {
        // check if we need to run the encoding test
        if (config_1.settings.FindEncoding.RunFindEncodingProcess) {
            (0, utils_1.testAllEncodings)(config_1.settings.FindEncoding.TestFile, config_1.settings.FindEncoding.ExpectedCorrectText);
            return;
        }
        // run some checks first
        (0, utils_1.checkPathAccess)({ pathToCheck: config_1.settings.App.PrintFolder });
        (0, utils_1.checkPathAccess)({
            pathToCheck: path.join(config_1.settings.App.PrintFolder, 'queue'),
            createIfMissing: true,
        });
        if (!config_1.settings.Debug.DeleteOriginalAfterPrint ||
            !config_1.settings.Debug.DeleteConvertedAfterPrint) {
            (0, utils_1.checkPathAccess)({
                pathToCheck: path.join(config_1.settings.App.PrintFolder, 'done'),
                createIfMissing: true,
            });
        }
        (0, utils_1.checkIfFileExtensionsAreValid)();
        const printerName = await (0, utils_1.checkIfPrinterIsValid)(config_1.settings.Debug.ShowAvailablePrintersOnStartup);
        // run printing loop
        const files = (0, utils_1.getFilesForPrinting)();
        const filesInQueue = (0, utils_1.moveFilesToQueue)(files);
        const convertedFiles = (0, utils_1.convertFilesToUtf8)(filesInQueue);
        // print files
        for (const file of convertedFiles) {
            const printProcess = await (0, utils_1.print)({
                file: file.converted,
                folder: path.join(config_1.settings.App.PrintFolder, 'queue'),
                printerName: printerName,
            });
            (0, utils_1.doCleanup)(file, printProcess);
            await (0, utils_1.waitAsync)(config_1.settings.App.PauseBetweenPrints);
        }
        (0, config_1.exit)('Printing finished');
    }
    catch (error) {
        (0, config_1.exit)(`Unexpected error: ${error}`);
    }
}
main();
// import { getDefaultPrinter, getPrinterNames, printFile } from './spawnUtils';
// (async function mainTest() {
//     console.log(await getPrinterNames());
//     console.log(
//         await printFile(
//             'Brother MFC-L3770CDW series Printer',
//             String.raw`C:\DEV\app\Kentriki_auto_file_print\auto-file-printing\original_files\done\Greek-test1.txt`,
//         ),
//     );
//     console.log(await getDefaultPrinter());
// })();
