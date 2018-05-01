var express = require('express');
var multer  = require('multer');
var db = require('../database');
const fileSizeLimit = ( 2* 1024 * 1024 );
var upload = multer({
    dest: './www/uploads/',
    limits: { fileSize: fileSizeLimit} //File size limit 2MegaBytes
  }).single('file');

var router = express.Router();

router.post('/', function(req, res, next)
{
  var fileRG;
  upload(req, res, function(err) {
    if(!err)
    {
      console.log("No error procede with db");
      db.saveFileUpload(req, res, next).then((e) =>{
        console.log("File id returned from db: " + e.fileRG.file_id);
        res.send({
          success: true,
          fileRG: e.fileRG
        });
      }).catch(function(error){
        console.log(error);
        var err = "File upload error: " + error;
        next(err);
      });

    }else
    {
      console.log("File upload error " + err);
      res.send({
              accessURL: 'NFE',
              reason: 'File to large or network error.',
              etype: 'File Upload Error'
      });
    }
  });
});

module.exports = router;
