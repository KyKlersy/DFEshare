var promise = require('bluebird');
//var StringDecoder = require('string_decoder').StringDecoder;
//var sdc = new StringDecoder('utf8');

const connectionString = process.env.DATABASE_URL;

var options = {
  promiseLib: promise
};

var pgpromise = require('pg-promise')(options);

pgpromise.pg.defaults.ssl = true;

var db = pgpromise(connectionString);


const gcs = require('@google-cloud/storage')({
  projectId: process.env.GOOGLE_BUCKET,
  credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS)
});



async function saveFileUpload(req, res)
{
  console.log("file name");
  console.log(req.body.originalfilename.toString());
  console.log("mime");
  console.log(req.body.originalfilemime.toString());
  console.log("multer named file: " + req.file.filename);
  //console.log("Original name: " + buf + " buf2: " + buf2 );
  //console.log(sdc.write(req.file.originalfilename));




    /*reader.onload = function()
    {
      onb = this.result;
      console.log("crypted original filename: " + onb);

      return res.send({
        results: 'ok'
      });
    }

    reader.readAsArrayBuffer(req.file.originalname);*/

    //console.log("crypted original filename: " + onb);
    var fn = req.file.filename;
    var ofn = req.body.originalfilename;
    var ofm = req.body.originalfilemime;
    //console.log("FN: " + fn + " OFN: " + ofn);
    //last removed quotes around everything
  let fileRG = await db.one('INSERT INTO encryptedfiles(file_id, file_timestamp, file_name, original_file_name, original_file_mime) VALUES(DEFAULT, DEFAULT, $1, $2, $3) RETURNING file_id', [fn, ofn, ofm]);
  let googleUpload = await gcs.bucket(process.env.GOOGLE_BUCKET_NAME).upload(req.file.path);

  let finalResults = {
    fileRG : fileRG,
    googleUpload : googleUpload
  };

  return finalResults;

}

function getFileById(req, res)
{
    var timeNow = new Date();
    var expireTime = new Date();
    var uuid = req.body.fileid;
    console.log("uuid" + uuid);
    expireTime.setHours(timeNow.getHours() + 1);
    console.log("exp time " + expireTime);
    var options = {
      action: 'read',
      expires: expireTime
    };

    db.one('SELECT * FROM encryptedFiles where file_id = $1', [uuid])
    .then(function(data){
      console.log(data);
      gcs
      .bucket(process.env.GOOGLE_BUCKET_NAME)
      .file(data.file_name)
      .getSignedUrl(options)
      .then(results =>
      {
        const url = results[0];

        //User is sent back download link one time use and nonce key. ON user download completuion key is sent back item is deleted.

        res.send({
          accessURL: url,
          originalName: data.original_file_name,
          originalFileMime: data.original_file_mime
        });
      })
    })
    .catch(function(err){
      console.log(err);
      return res.send({
        accessURL: 'NFE'
      });
    });
}

module.exports = {
  saveFileUpload: saveFileUpload,
  getFileById: getFileById
};
