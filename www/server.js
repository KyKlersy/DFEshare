require('dotenv').config();
const bodyParser = require('body-parser');
const express = require('express');
const http = require('http');
const path = require('path');
const uploadFile = require(path.join(__dirname, '/routes/fileUpload'));
const downloadFile = require(path.join(__dirname, '/routes/getFileDownload'));

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.use(express.static(path.join(__dirname, '../dist')));
app.use('/uploadfile', uploadFile);
app.use('/downloadfile', downloadFile);

app.get('*', (req, res, next) => {
  res.sendFile(path.join(__dirname, '/dist/index.html'));
});

app.use(function(err, req, res, next) {
    console.log(err);
});

app.listen(process.env.PORT || 3000);
