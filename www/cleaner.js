const path = require('path');
const database = require(path.join(__dirname, 'database'));

function cleanFiles()
{
  database.cleanDeadFiles();
}

function cleanRequestedFiles() {
  database.cleanExpiredRequestedFiles();
}

 module.exports =
 {
   cleanFiles: cleanFiles,
   cleanRequestedFiles: cleanRequestedFiles

 }
