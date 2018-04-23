const path = require('path');
const database = require(path.join(__dirname, 'database'));

function cleanFiles()
{
  database.cleanDeadFiles();

}

 module.exports =
 {
   cleanFiles: cleanFiles
 }
