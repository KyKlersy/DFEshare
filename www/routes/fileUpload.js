var express = require('express');
var multer  = require('multer');
var db = require('../database');

var upload = multer({
    dest: './www/uploads/',
    limits: { fileSize: 2* 1024 * 1024}
  }).single('file');

const gcs = require('@google-cloud/storage')({
  projectId: process.env.GOOGLE_BUCKET,
  credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS)
});

var router = express.Router();

router.post('/', function(req, res)
{
  var fileRG;
  upload(req, res, function(err) {
    if(err)
    {
      console.log("error");
      return res.send({
              success: false
            });
    }

    db.saveFileUpload(req, res).then((e) =>{
      console.log("File id returned from db: " + e.fileRG.file_id);
      res.send({
        success: true,
        fileRG: e.fileRG
      });

    }).catch(function(error){
      console.log(error);
      return res.send({
              success: false
            });
    });
  });
});

module.exports = router;
