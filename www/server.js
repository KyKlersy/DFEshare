require('dotenv').config();
const bodyParser = require('body-parser');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const RateLimit  = require('express-rate-limit');
const http = require('http');
const path = require('path');
const uploadFile = require(path.join(__dirname, '/routes/fileUpload'));
const downloadFile = require(path.join(__dirname, '/routes/getFileDownload'));

// const bucketName = process.env.GOOGLE_BUCKET_NAME;
// const allowBucket = ' https://storage.googleapis.com/' + bucketName +'/*';
const cleanupscript = require(path.join(__dirname, '/cleaner'));

const app = express();
app.use(helmet());
app.use(cors());

app.enable('trust proxy'); //Behind Heroku, need to set this to trust as they act as a reverse prox to this app.

var limiter = new RateLimit({
  windowMs: 25*60*1000, // 25 minutes
  max: 10, // limit each IP to 10 requests per windowMs to prevent abuse.
  delayMs: 0 // disable delaying - full speed until the max limit is reached
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.use(express.static(path.join(__dirname, '../dist')));

app.use('/uploadfile', limiter ,uploadFile);
app.use('/downloadfile', limiter ,downloadFile);

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
},3600000);

//Run Cleanup File request script every 10 minutes, in milliseconds.
//10 minute window to download requested file before self destruct.
setInterval(doCleanFileRequests=>{

  cleanupscript.cleanRequestedFiles();
},600000);

app.listen(process.env.PORT || 3000);
