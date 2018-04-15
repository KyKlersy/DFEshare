const bodyParser = require('body-parser');
const express = require('express');
const http = require('http');
const path = require('path');
const uploadFile = require(path.join(__dirname, '/routes/fileUpload'));

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.use(express.static(path.join(__dirname, '../dist')));
//app.use('/uploadfile', uploadFile);

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '/dist/index.html'));
});
console.log(__dirname);

app.listen(process.env.PORT || 3000);
