// create a function to read files from ./original_files directory and return the content
const fs = require('fs-extra');
const path = require('path');
const util = require('util');
const printer = require('@thiagoelg/node-printer');

// const printers = printer.getPrinters();
// console.log('installed printers:\n' + JSON.stringify(printers, null, 2));

// console.log('installed printers:\n' + util.inspect(printer.getPrinters(), { colors: true, depth: 10 }));

// const readFiles = (dir, onFileContent, onError) => {

function readDirectory(dir) {
    let fileObjs = [];

    let files = fs.readdirSync(dir);
    for (let i = 0; i < files.length; i++) {
        let file = files[i];
        file = path.join(dir, file);
        let content = fs.readFileSync(file, 'utf8');
        let fileObj = {
            fileName: file,
            content: content,
        };
        fileObjs.push(fileObj);
    }
    return fileObjs;
}

function printFile(printerName, data) {
    printer.printDirect({
        // data: 'test message',
        // printer: 'Brother MFC-L3770CDW series Printer',
        printer: printerName,
        type: 'TEXT',
        // type: 'RAW',
        // type: 'PDF',

        // data: new Buffer('I will be written', 'ascii'),
        // data: new Buffer('despina', 'utf8'),
        data: data,
        docname: 'Doc2',

        success: function (jobId) {
            console.log('printed job: ' + jobId);
        },
        error: function (err) {
            console.log(err);
        },
    });
}

let files = readDirectory(path.join(__dirname, 'original_files'));
// console.log('files: ' + util.inspect(files, { colors: true, depth: 10 }));

const testFileContent = files.filter((file) => file.fileName.includes('a.txt'))[0].content;

console.log('testFileContent: ' + testFileContent);

// const printerName = 'Microsoft Print to PDF';
const printerName = '\\\\WSUSSRV01.hio.local\\5th Floor KYOCERA 4501 Multimachine (Cabinet)';
// const printerName = '5th Floor KYOCERA 4501 Multimachine (Cabinet)';
// printFile(printerName, testFileContent);

// This doesn't work. Try to print using windows command line. see below.
// λ print /d:"\\WSUSSRV01.hio.local\5th Floor KYOCERA 4501 Multimachine (Cabinet)" original_files\a.txt
// C:\dev\app\ff\auto-file-printing\original_files\a.txt is currently being printed
