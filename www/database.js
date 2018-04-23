const promise = require('bluebird');
const fs = require('fs');
const path = require('path');


const connectionString = process.env.DATABASE_URL;

var options = {
  promiseLib: promise
};

var pgpromise = require('pg-promise')(options);

//Dates in utc format
pgpromise.pg.types.setTypeParser(1114, function (stringValue) {
    return stringValue;
});

pgpromise.pg.defaults.ssl = true;

var db = pgpromise(connectionString);


const gcs = require('@google-cloud/storage')({
  projectId: process.env.GOOGLE_BUCKET,
  credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS)
});



async function saveFileUpload(req, res, next)
{
  var fn =  req.file.filename;
  var ofn = req.body.originalfilename;
  var ofm = req.body.originalfilemime;
  console.log("FN: ");
  console.log(fn);
  console.log(" OFN: ");
  console.log(ofn);
  console.log(" OFM: ");
  console.log(ofm);

  let fileRG = await db.one('INSERT INTO encryptedfiles(file_id, file_timestamp, file_name, original_file_name, original_file_mime) VALUES(DEFAULT, DEFAULT, $1, $2, $3) RETURNING file_id', [fn, ofn, ofm]);
  let googleUpload = await gcs.bucket(process.env.GOOGLE_BUCKET_NAME).upload(req.file.path);

  let finalResults = {
    fileRG : fileRG,
    googleUpload : googleUpload
  };

  return finalResults;

}

function getFileById(req, res, next)
{
  var timeNow = new Date();
  var expireTime = new Date();
  var uuid = req.body.fileid;
  var err;
  console.log("uuid" + uuid);
  //expireTime.setHours(timeNow.getHours() + 1);
  expireTime.setMinutes(timeNow.getMinutes() + 1); //Testing timestamp time out, revert this back to comment above for production.
  console.log("exp time " + expireTime);
  var options = {
    action: 'read',
    expires: expireTime
  };

  db.one('SELECT * FROM encryptedFiles where file_id = $1', [uuid])
  .then(data =>{
    console.log(data);
    //var timeDif = ((timeNow/ 1000.0) - new Date(data.file_timestamp));
    var dbDate = Date.parse(data.file_timestamp);
    var utcDate = (new Date().getTime());
     console.log("DB date returned: " + data.file_timestamp);
    // console.log("Local UTC time: " + utcDate);
     console.log("DB UTC time: " + dbDate);

    var timeDif = (( dbDate - utcDate )/1000.0);
    console.log("Time stamp difference: " + timeDif);

    //Difference between timestamp of when file was saved and the time now, vs's 24hrs.
    // > than 24hrs means the file has been deleted otherwise file is still valid.
    if(timeDif > 43200)
    {
      console.log("Past 24hr limit file removed.");
      err = {
        accessURL: 'NFE',
        reason: 'Past 24 Hour Limit.'
      }
      next(err);
    }
    else
    {
      //console.log("original name in uint8 " + new Uint8Array(data.original_file_name));
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
    }
  }).catch(function(error){
    console.log(error);
    err = {
      accessURL: 'NFE',
      reason: 'File no longer exists or one time download has already been claimed.'
    }
    next(err);
  });
}

function cleanDeadFiles()
{
  const uploadDirName = '/uploads/';
  const uploadDirPath = (path.join(__dirname + uploadDirName));
  console.log("Now running delete check on database, expired files will be deleted from database cloud older than 24hrs."
  + " Server local temp files will be purged.");

  //console.log("Path: " + (path.join(__dirname + uploadDirName)) );

  //var fn = '0a084cf13043660b8e9f097899e32c71';
  //console.log("File to delete: " + (path.join(uploadDirPath + fn)) );

  //1 Hour Check to clear server local temp files.
  db.any('SELECT (file_name) FROM encryptedFiles WHERE file_timestamp < (NOW() - \'1 hour\'::interval )').then(data =>{

    for(var i = 0; i < data.length; i++)
    {
      fs.statSync((path.join(uploadDirPath + data[i].file_name)))

      if(!err)
      {
        fs.unlinkSync((path.join(uploadDirPath + data[i].file_name)));
      }
    }
  });


  //24 Hour Check deletes time expired files from db and cloud storage.
  db.any('SELECT (file_name) FROM encryptedFiles WHERE file_timestamp < (NOW() - \'24 hour\'::interval )').then(data =>{

    //console.log("Data: " + JSON.stringify(data));
    //console.log("Data length: " + data.length);

    for(var i = 0; i < data.length; i++)
    {
      console.log("row: " + data[i].file_name);

      gcs
      .bucket(process.env.GOOGLE_BUCKET_NAME)
      .file(data[i].file_name)
      .delete()
      .catch(err => {
        console.error('ERROR:', err);
      });

    }
  });

  //After removing from cloud, nuke from database.
  db.none('DELETE FROM encryptedFiles WHERE file_timestamp < (NOW() - \'24 hour\'::interval )').catch(function(error){
    console.log(error);
  });

}

module.exports = {
  saveFileUpload: saveFileUpload,
  getFileById: getFileById,
  cleanDeadFiles: cleanDeadFiles
};
