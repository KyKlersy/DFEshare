var express = require('express');

var db = require('../database');

var router = express.Router();

router.post('/', function(req, res, next){
    db.getFileById(req,res,next);
});

module.exports = router;
