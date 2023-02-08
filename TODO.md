# TODO

Fix the printing issue.

## Try to replace cmd:print with PowerShell:Out-Printer. I don't know if it will work, but it's worth a try

<https://ss64.com/ps/out-printer.html>
<https://techexpert.tips/powershell/powershell-printing-file/>
<https://linuxhint.com/print-file-from-powershell-script/>

## Retry the node-printer

```javascript
import printer from '@thiagoelg/node-printer';

const printers = printer.getPrinters();
console.log('installed printers:\n' + JSON.stringify(printers, null, 2));

printer.printDirect({
  printer: 'Brother MFC-L3770CDW series Printer',
  type: 'RAW',
  data: new Buffer('test data', 'utf8'),
  docname: 'Printjob from node-printer',

  success: function (jobId) {
    console.log('printed job: ' + jobId);
  },
  error: function (err) {
    console.log(err);
  },
});
```
