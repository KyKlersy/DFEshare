require('dotenv').config();
const bodyParser = require('body-parser');
const express = require('express');
const cors = require('cors');
const http = require('http');
const path = require('path');
const uploadFile = require(path.join(__dirname, '/routes/fileUpload'));
const downloadFile = require(path.join(__dirname, '/routes/getFileDownload'));

// const bucketName = process.env.GOOGLE_BUCKET_NAME;
// const allowBucket = ' https://storage.googleapis.com/' + bucketName +'/*';
const cleanupscript = require(path.join(__dirname, '/cleaner'));

const app = express();
app.use(cors());


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.use(express.static(path.join(__dirname, '../dist')));

app.use('/uploadfile', uploadFile);
app.use('/downloadfile', downloadFile);

app.get('*', (req, res, next) => {
  res.sendFile(path.join(__dirname, '/dist/index.html'));
});

app.use(function(err, req, res, next) {
    console.log("General Error Catcher " + JSON.stringify(err));
    res.send(err);
});

//Run Cleanup script every hour, in milliseconds.
setInterval(doClean=>{
  cleanupscript.cleanFiles();
},60000); // Debug testing checks once a minute revert.
//3600000  For production use this number, check once every hour

app.listen(process.env.PORT || 3000);
