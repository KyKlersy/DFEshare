const promise = require('bluebird');
const fs = require('fs');
const path = require('path');


const connectionString = process.env.DATABASE_URL;

var options = {
  promiseLib: promise,
  capSQL: true
};

var pgpromise = require('pg-promise')(options);

//Dates in utc format
pgpromise.pg.types.setTypeParser(1114, function (stringValue) {
    return new Date(stringValue + 'Z');
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
  // console.log("FN: ");
  // console.log(fn);
  // console.log(" OFN: ");
  // console.log(ofn);
  // console.log(" OFM: ");
  // console.log(ofm);

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

  db.one('SELECT * FROM encryptedfiles where file_id = $1', [uuid])
  .then(data =>{

    var dbDate = new Date(data.file_timestamp);

    var utcDate = new Date().getTime();

    var timeDif = (( utcDate - dbDate )/1000.0); //Timestamp diference in seconds.
    console.log("Time stamp difference: " + timeDif);

    //Difference between timestamp of when file was saved and the time now, vs's 24hrs.
    // > than 24hrs means the file has been deleted otherwise file is still valid.
    if(timeDif > 86400) //86400
    {
      console.log("Past 24hr limit file removed.");
      err = {
        accessURL: 'NFE',
        reason: 'Past 24 Hour Limit.',
        etype: 'Expired File.'
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

        db.none('INSERT INTO requestedfiles( r_file_id, r_file_name, r_file_timestamp ) VALUES ($1, $2, DEFAULT)', [data.file_id, data.file_name]).catch(function(error){
          console.log(error);
        });


      })
    }
  }).catch(function(error){
    console.log(error);
    err = {
      accessURL: 'NFE',
      reason: 'File no longer exists or one time download has already been claimed.',
      etype: 'File not found.'
    }
    next(err);
  });
}

function cleanDeadFiles()
{
  const uploadDirName = '/uploads/';
  const uploadDirPath = (path.join(__dirname + uploadDirName));

  const colset = new pgpromise.helpers.ColumnSet(['r_file_id','r_file_name','r_file_timestamp'],{table:'requestedfiles'});

  // console.log("Now running delete check on database, expired files will be deleted from database cloud older than 24hrs."
  // + " Server local temp files will be purged.");

  //1 Hour Check to clear server local temp files.
  // db.any('SELECT (file_name) FROM encryptedfiles WHERE file_timestamp < (NOW() - \'1 hour\'::interval )').then(data =>{
  //
  //   for(var i = 0; i < data.length; i++)
  //   {
  //     if(fs.existsSync((path.join(uploadDirPath + data[i].file_name))))
  //     {
  //       fs.unlinkSync((path.join(uploadDirPath + data[i].file_name)));
  //     }
  //   }
  // });


  //24 Hour Check deletes time expired files from db and cloud storage.
  db.any('SELECT * FROM encryptedfiles WHERE encryptedfiles.file_id NOT IN (SELECT requestedfiles.r_file_id from requestedfiles) AND (encryptedfiles.file_timestamp < (NOW() - \'24 hours\'::interval)) ').then(data =>{

    var values = [];
    for(var i = 0; i < data.length; i++)
    {
      values.push({r_file_id: data[i].file_id, r_file_name: data[i].file_name, r_file_timestamp: data[i].file_timestamp});
    }

    if(data.length > 0)
    {
      const query = pgpromise.helpers.insert( values, colset );

      db.none(query).catch(error => {
         console.log("Error inserting dead files: " + error);
      });

      //After removing from cloud, nuke from database.
      db.none('DELETE FROM encryptedfiles WHERE file_timestamp < (NOW() - \'24 hours\'::interval )').catch(function(error){
        console.log(error);
      });

    }

  });

}

function cleanExpiredRequestedFiles()
{
  const uploadDirName = '/uploads/';
  const uploadDirPath = (path.join(__dirname + uploadDirName));
  // console.log("Now running requested file cleanup, 10 minute past expired files that were requested will be deleted from database, cloud and "
  // + " local temp files if exists will be purged.");

  //10minutes Check deletes time expired files from db and cloud storage.
  db.any('SELECT * FROM requestedfiles WHERE r_file_timestamp < (NOW() - \'10 minutes\'::interval )').then(data =>
  {

    if(data.length < 1)
    {
      return;
    }

    for(var i = 0; i < data.length; i++)
    {

      gcs
      .bucket(process.env.GOOGLE_BUCKET_NAME)
      .file(data[i].r_file_name)
      .delete()
      .catch(error => {
        console.error('Google Bucket Delete Error: ', error);
      });


      db.none('DELETE FROM encryptedfiles WHERE file_name = $1',[data[i].r_file_name])
      .catch(function(error){
        console.log("Error deleting from encryptedfiles: " + error);
      });

      //Cover base case where user may upload and request file in < 1hr, faster than normal server does local file cleanup.
      if(fs.existsSync((path.join(uploadDirPath + data[i].r_file_name))))
      {
        fs.unlinkSync((path.join(uploadDirPath + data[i].r_file_name)));
      }
    }

    //changed to 1 from 10 minutes
    db.none('DELETE FROM requestedfiles WHERE r_file_timestamp < (NOW() - \'10 minutes\'::interval)').catch(function(error){
        console.log("Error deleting from requested files: " + error);
    });

  }).catch(function(error){
      console.log("Selection from request file error: " + error);
  });

  return;
}


module.exports = {
  saveFileUpload: saveFileUpload,
  getFileById: getFileById,
  cleanDeadFiles: cleanDeadFiles,
  cleanExpiredRequestedFiles: cleanExpiredRequestedFiles
};
