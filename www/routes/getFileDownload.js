var express = require('express');

var db = require('../database');

var router = express.Router();

const gcs = require('@google-cloud/storage')({
  projectId: process.env.GOOGLE_BUCKET,
  credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS)
});

router.post('/', function(req, res, next){
    db.getFileById(req,res,next);
});

module.exports = router;
