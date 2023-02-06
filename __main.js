// import { getPrinters } from 'node-printer';

// // var printer = require("../lib"),
util = require('util');
// console.log('installed printers:\n' + util.inspect(getPrinters(), { colors: true, depth: 10 }));

const printer = require('@thiagoelg/node-printer');

const printers = printer.getPrinters();
// console.log('installed printers:\n' + JSON.stringify(printers, null, 2));

console.log('installed printers:\n' + util.inspect(printer.getPrinters(), { colors: true, depth: 10 }));

// const filename = 'C:\\Dev\\app\\tests\\printing\\ff.txt';
// var fs = require('fs');
// printer.printDirect({data:fs.readFileSync(filename),
//   printer: process.env[3], // printer name, if missing then will print to default printer
//   success:function(jobID){
//     console.log("sent to printer with ID: "+jobID);
//   },
//   error:function(err){
//     console.log(err);
//   }
// });

printer.printDirect({
    // data: 'test message',
    // printer: 'Brother MFC-L3770CDW series Printer',
    printer: 'test Microsoft PCL6 Class Driver',
    type: 'RAW',
    // type: 'PDF',

    // data: new Buffer('I will be written', 'ascii'),
    data: new Buffer('despina', 'utf8'),
    // data: new Buffer('I will be written', 'utf16le'),
    // data: new Buffer("I will be written", "ucs2"),
    // data: new Buffer('I will be written', 'base64'),
    // data: new Buffer("I will be written", "latin1"),
    // data: new Buffer("I will be written", "binary"),
    // data: new Buffer("I will be written", "hex"),
    docname: 'Doc2',

    success: function (jobId) {
        console.log('printed job: ' + jobId);
    },
    error: function (err) {
        console.log(err);
    },
});
