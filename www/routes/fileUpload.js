var express = require('express');
var multer  = require('multer');
var upload = multer({ dest: './www/uploads/' });

var router = express.Router();

router.post('/', upload.single('file') ,function(req, res, next) {
  if (!req.file)
  {
    console.log("No file received");
    return res.send({
      success: false
    });
  } else
  {
    console.log(req.file + "File.");
    console.log(Date.now());
    res.send({
      success: true
    });
  }
});

module.exports = router;
