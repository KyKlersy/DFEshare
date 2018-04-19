var express = require('express');

var db = require('../database');

var router = express.Router();

const gcs = require('@google-cloud/storage')({
  projectId: process.env.GOOGLE_BUCKET,
  credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS)
});


router.post('/', function(req, res){
  console.log("Atleast we made it here");
  console.log("req body " + req.body);
  db.getFileById(req,res);
});

module.exports = router;
