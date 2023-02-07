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
const chalk_1 = __importDefault(require("chalk"));
const fs = __importStar(require("fs-extra"));
const iconv_1 = require("iconv");
const path = __importStar(require("path"));
const config_1 = require("./config");
const utils_1 = require("./utils");
function main() {
    return __awaiter(this, void 0, void 0, function* () {
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
        const printerName = (0, utils_1.checkIfPrinterIsValid)(config_1.settings.Debug.ShowAvailablePrintersOnStartup);
        // Run printing loop
        const files = (0, utils_1.getFilesForPrinting)();
        const filesInQueue = (0, utils_1.moveFilesToQueue)(files);
        const convertedFiles = (0, utils_1.convertFilesToUtf8)(filesInQueue);
        // send file to printer
        for (const file of convertedFiles) {
            const printProcess = yield (0, utils_1.printFile)({
                file: file.converted,
                folder: path.join(config_1.settings.App.PrintFolder, 'queue'),
                printer: printerName,
            });
            if (printProcess.success) {
                (0, config_1.log)(chalk_1.default.green(`Printed file ${chalk_1.default.yellow(file.original)}`));
                if (config_1.settings.Debug.DeleteOriginalAfterPrint) {
                    fs.removeSync(path.join(config_1.settings.App.PrintFolder, 'queue', file.original));
                }
                else {
                    fs.moveSync(path.join(config_1.settings.App.PrintFolder, 'queue', file.original), path.join(config_1.settings.App.PrintFolder, 'done', file.original));
                }
                if (config_1.settings.Debug.DeleteConvertedAfterPrint) {
                    fs.removeSync(path.join(config_1.settings.App.PrintFolder, 'queue', file.converted));
                }
                else {
                    fs.moveSync(path.join(config_1.settings.App.PrintFolder, 'queue', file.converted), path.join(config_1.settings.App.PrintFolder, 'done', file.converted));
                }
            }
            else {
                (0, config_1.log)(chalk_1.default.red(`Error printing file ${chalk_1.default.yellow(file.converted)}`));
                fs.moveSync(path.join(config_1.settings.App.PrintFolder, 'queue', file.converted), path.join(config_1.settings.App.PrintFolder, 'queue', 'print_error_' + file));
            }
        }
    });
}
// main();
const testFile = path.join(config_1.settings.App.PrintFolder, 'test2.txt');
// const testFile = path.join(settings.App.PrintFolder, 'test2.txt');
// path.join(settings.App.PrintFolder, 'Greek-test1.txt'),
const txtBuffer = fs.readFileSync(testFile);
const supportedEncodings = [
    'ANSI_X3.4-1968',
    'ANSI_X3.4-1986',
    'ASCII',
    'CP367',
    'IBM367',
    'ISO-IR-6',
    'ISO646-US',
    'ISO_646.IRV:1991',
    'US',
    'US-ASCII',
    'CSASCII',
    'UTF-8',
    'ISO-10646-UCS-2',
    'UCS-2',
    'CSUNICODE',
    'UCS-2BE',
    'UNICODE-1-1',
    'UNICODEBIG',
    'CSUNICODE11',
    'UCS-2LE',
    'UNICODELITTLE',
    'ISO-10646-UCS-4',
    'UCS-4',
    'CSUCS4',
    'UCS-4BE',
    'UCS-4LE',
    'UTF-16',
    'UTF-16BE',
    'UTF-16LE',
    'UTF-32',
    'UTF-32BE',
    'UTF-32LE',
    'UNICODE-1-1-UTF-7',
    'UTF-7',
    'CSUNICODE11UTF7',
    'UCS-2-INTERNAL',
    'UCS-2-SWAPPED',
    'UCS-4-INTERNAL',
    'UCS-4-SWAPPED',
    'C99',
    'JAVA',
    'CP819',
    'IBM819',
    'ISO-8859-1',
    'ISO-IR-100',
    'ISO8859-1',
    'ISO_8859-1',
    'ISO_8859-1:1987',
    'L1',
    'LATIN1',
    'CSISOLATIN1',
    'ISO-8859-2',
    'ISO-IR-101',
    'ISO8859-2',
    'ISO_8859-2',
    'ISO_8859-2:1987',
    'L2',
    'LATIN2',
    'CSISOLATIN2',
    'ISO-8859-3',
    'ISO-IR-109',
    'ISO8859-3',
    'ISO_8859-3',
    'ISO_8859-3:1988',
    'L3',
    'LATIN3',
    'CSISOLATIN3',
    'ISO-8859-4',
    'ISO-IR-110',
    'ISO8859-4',
    'ISO_8859-4',
    'ISO_8859-4:1988',
    'L4',
    'LATIN4',
    'CSISOLATIN4',
    'CYRILLIC',
    'ISO-8859-5',
    'ISO-IR-144',
    'ISO8859-5',
    'ISO_8859-5',
    'ISO_8859-5:1988',
    'CSISOLATINCYRILLIC',
    'ARABIC',
    'ASMO-708',
    'ECMA-114',
    'ISO-8859-6',
    'ISO-IR-127',
    'ISO8859-6',
    'ISO_8859-6',
    'ISO_8859-6:1987',
    'CSISOLATINARABIC',
    'ECMA-118',
    'ELOT_928',
    'GREEK',
    'GREEK8',
    'ISO-8859-7',
    'ISO-IR-126',
    'ISO8859-7',
    'ISO_8859-7',
    'ISO_8859-7:1987',
    'ISO_8859-7:2003',
    'CSISOLATINGREEK',
    'HEBREW',
    'ISO-8859-8',
    'ISO-IR-138',
    'ISO8859-8',
    'ISO_8859-8',
    'ISO_8859-8:1988',
    'CSISOLATINHEBREW',
    'ISO-8859-9',
    'ISO-IR-148',
    'ISO8859-9',
    'ISO_8859-9',
    'ISO_8859-9:1989',
    'L5',
    'LATIN5',
    'CSISOLATIN5',
    'ISO-8859-10',
    'ISO-IR-157',
    'ISO8859-10',
    'ISO_8859-10',
    'ISO_8859-10:1992',
    'L6',
    'LATIN6',
    'CSISOLATIN6',
    'ISO-8859-11',
    'ISO8859-11',
    'ISO_8859-11',
    'ISO-8859-13',
    'ISO-IR-179',
    'ISO8859-13',
    'ISO_8859-13',
    'L7',
    'LATIN7',
    'ISO-8859-14',
    'ISO-CELTIC',
    'ISO-IR-199',
    'ISO8859-14',
    'ISO_8859-14',
    'ISO_8859-14:1998',
    'L8',
    'LATIN8',
    'ISO-8859-15',
    'ISO-IR-203',
    'ISO8859-15',
    'ISO_8859-15',
    'ISO_8859-15:1998',
    'LATIN-9',
    'ISO-8859-16',
    'ISO-IR-226',
    'ISO8859-16',
    'ISO_8859-16',
    'ISO_8859-16:2001',
    'L10',
    'LATIN10',
    'KOI8-R',
    'CSKOI8R',
    'KOI8-U',
    'KOI8-RU',
    'CP1250',
    'MS-EE',
    'WINDOWS-1250',
    'CP1251',
    'MS-CYRL',
    'WINDOWS-1251',
    'CP1252',
    'MS-ANSI',
    'WINDOWS-1252',
    'CP1253',
    'MS-GREEK',
    'WINDOWS-1253',
    'CP1254',
    'MS-TURK',
    'WINDOWS-1254',
    'CP1255',
    'MS-HEBR',
    'WINDOWS-1255',
    'CP1256',
    'MS-ARAB',
    'WINDOWS-1256',
    'CP1257',
    'WINBALTRIM',
    'WINDOWS-1257',
    'CP1258',
    'WINDOWS-1258',
    '850',
    'CP850',
    'IBM850',
    'CSPC850MULTILINGUAL',
    '862',
    'CP862',
    'IBM862',
    'CSPC862LATINHEBREW',
    '866',
    'CP866',
    'IBM866',
    'CSIBM866',
    'MAC',
    'MACINTOSH',
    'MACROMAN',
    'CSMACINTOSH',
    'MACCENTRALEUROPE',
    'MACICELAND',
    'MACCROATIAN',
    'MACROMANIA',
    'MACCYRILLIC',
    'MACUKRAINE',
    'MACGREEK',
    'MACTURKISH',
    'MACHEBREW',
    'MACARABIC',
    'MACTHAI',
    'HP-ROMAN8',
    'R8',
    'ROMAN8',
    'CSHPROMAN8',
    'NEXTSTEP',
    'ARMSCII-8',
    'GEORGIAN-ACADEMY',
    'GEORGIAN-PS',
    'KOI8-T',
    'CP154',
    'CYRILLIC-ASIAN',
    'PT154',
    'PTCP154',
    'CSPTCP154',
    'KZ-1048',
    'RK1048',
    'STRK1048-2002',
    'CSKZ1048',
    'MULELAO-1',
    'CP1133',
    'IBM-CP1133',
    'ISO-IR-166',
    'TIS-620',
    'TIS620',
    'TIS620-0',
    'TIS620.2529-1',
    'TIS620.2533-0',
    'TIS620.2533-1',
    'CP874',
    'WINDOWS-874',
    'VISCII',
    'VISCII1.1-1',
    'CSVISCII',
    'TCVN',
    'TCVN-5712',
    'TCVN5712-1',
    'TCVN5712-1:1993',
    'ISO-IR-14',
    'ISO646-JP',
    'JIS_C6220-1969-RO',
    'JP',
    'CSISO14JISC6220RO',
    'JISX0201-1976',
    'JIS_X0201',
    'X0201',
    'CSHALFWIDTHKATAKANA',
    'ISO-IR-87',
    'JIS0208',
    'JIS_C6226-1983',
    'JIS_X0208',
    'JIS_X0208-1983',
    'JIS_X0208-1990',
    'X0208',
    'CSISO87JISX0208',
    'ISO-IR-159',
    'JIS_X0212',
    'JIS_X0212-1990',
    'JIS_X0212.1990-0',
    'X0212',
    'CSISO159JISX02121990',
    'CN',
    'GB_1988-80',
    'ISO-IR-57',
    'ISO646-CN',
    'CSISO57GB1988',
    'CHINESE',
    'GB_2312-80',
    'ISO-IR-58',
    'CSISO58GB231280',
    'CN-GB-ISOIR165',
    'ISO-IR-165',
    'ISO-IR-149',
    'KOREAN',
    'KSC_5601',
    'KS_C_5601-1987',
    'KS_C_5601-1989',
    'CSKSC56011987',
    'EUC-JP',
    'EUCJP',
    'EXTENDED_UNIX_CODE_PACKED_FORMAT_FOR_JAPANESE',
    'CSEUCPKDFMTJAPANESE',
    'MS_KANJI',
    'SHIFT-JIS',
    'SHIFT_JIS',
    'SJIS',
    'CSSHIFTJIS',
    'CP932',
    'ISO-2022-JP',
    'CSISO2022JP',
    'ISO-2022-JP-1',
    'ISO-2022-JP-2',
    'CSISO2022JP2',
    'CN-GB',
    'EUC-CN',
    'EUCCN',
    'GB2312',
    'CSGB2312',
    'GBK',
    'CP936',
    'MS936',
    'WINDOWS-936',
    'GB18030',
    'ISO-2022-CN',
    'CSISO2022CN',
    'ISO-2022-CN-EXT',
    'HZ',
    'HZ-GB-2312',
    'EUC-TW',
    'EUCTW',
    'CSEUCTW',
    'BIG-5',
    'BIG-FIVE',
    'BIG5',
    'BIGFIVE',
    'CN-BIG5',
    'CSBIG5',
    'CP950',
    'BIG5-HKSCS:1999',
    'BIG5-HKSCS:2001',
    'BIG5-HKSCS',
    'BIG5-HKSCS:2004',
    'BIG5HKSCS',
    'EUC-KR',
    'EUCKR',
    'CSEUCKR',
    'CP949',
    'UHC',
    'CP1361',
    'JOHAB',
    'ISO-2022-KR',
    'CSISO2022KR',
    'CP856',
    'CP922',
    'CP943',
    'CP1046',
    'CP1124',
    'CP1129',
    'CP1161',
    'IBM-1161',
    'IBM1161',
    'CSIBM1161',
    'CP1162',
    'IBM-1162',
    'IBM1162',
    'CSIBM1162',
    'CP1163',
    'IBM-1163',
    'IBM1163',
    'CSIBM1163',
    'DEC-KANJI',
    'DEC-HANYU',
    '437',
    'CP437',
    'IBM437',
    'CSPC8CODEPAGE437',
    'CP737',
    'CP775',
    'IBM775',
    'CSPC775BALTIC',
    '852',
    'CP852',
    'IBM852',
    'CSPCP852',
    'CP853',
    '855',
    'CP855',
    'IBM855',
    'CSIBM855',
    '857',
    'CP857',
    'IBM857',
    'CSIBM857',
    'CP858',
    '860',
    'CP860',
    'IBM860',
    'CSIBM860',
    '861',
    'CP-IS',
    'CP861',
    'IBM861',
    'CSIBM861',
    '863',
    'CP863',
    'IBM863',
    'CSIBM863',
    'CP864',
    'IBM864',
    'CSIBM864',
    '865',
    'CP865',
    'IBM865',
    'CSIBM865',
    '869',
    'CP-GR',
    'CP869',
    'IBM869',
    'CSIBM869',
    'CP1125',
    'EUC-JISX0213',
    'SHIFT_JISX0213',
    'ISO-2022-JP-3',
    'BIG5-2003',
    'ISO-IR-230',
    'TDS565',
    'ATARI',
    'ATARIST',
    'RISCOS-LATIN1',
];
for (const encoding of supportedEncodings) {
    try {
        const iconv = new iconv_1.Iconv(encoding, 'UTF-8');
        const convertedBuffer = iconv.convert(txtBuffer);
        const converted = convertedBuffer.toString('utf8');
        const convertedLines = converted.split('\r\n');
        const linesWithName = convertedLines.filter((line) => line.includes('ANTONIS'));
        if (linesWithName.length > 0) {
            (0, config_1.log)(chalk_1.default.green(encoding), linesWithName[0]);
        }
        else {
            (0, config_1.log)(chalk_1.default.yellow(encoding));
        }
    }
    catch (error) {
        (0, config_1.log)(chalk_1.default.red(encoding));
    }
}
