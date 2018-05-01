
importScripts('https://unpkg.com/promise-worker-transferable@1.0.4/dist/promise-worker.register.min.js');
//Promise worker wraps the message event in a promise.
//Registering the function event here.
registerPromiseWorker(function(message){

  //If command is encrypt file.
  if(message.rt === 'ef')
  {
    //Do encrypt file and return when promise resolves from async function encryptFile
    return encryptFile(message.data);
  }
  else if(message.rt === 'df') //Decrypt file command.
  {
    //Do decrypt file and return when promise resolves from async function decryptFile
    return decryptFile(message);
  }

});

//This function is used for encrypting the file.
async function encryptFile(fileSent)
{

  var enc = new TextEncoder('utf-8');

  //Ended up not being used as the plan was to sign the aes key.
  //Ended up using AES-256-GCM which uses an authentication code already.
  //Left in for future reference.
  // const rsaAlg = {
  //     name: "RSA-OAEP",
  //     hash: "SHA-256",
  //     publicExponent: new Uint8Array([1, 0, 1]),
  //     modulusLength: 2048
  // };

  //Generate random initialize vector of 12bytes.
  var iv = crypto.getRandomValues(new Uint8Array(12));

  //transform the raw binary buffer to a string and base64 the result.
  var ivstring = iv.toString();
  var ivReplace = ivstring.replace(/,/g,"-");
  var ivExport = btoa(ivReplace);
  //For demo purposes left in to console log it out. In both raw and b64 form.
  console.log(iv.toString());
  console.log(ivExport);

  //Set options for AES-Key
  //Using AES-GCM, 256 with an IV.
  const aesAlg = {
      name: "AES-GCM",
      length: 256,
      iv: iv,
  };


  try {

    console.log("file name: " + fileSent.item(0).name);
    var filename = convertStringToArrayBufferView(fileSent.item(0).name);
    var filetype = convertStringToArrayBufferView(fileSent.item(0).type);
    console.log("file name arr: " + filename);
    console.log("file mime arr: " + filetype);

    console.log("mime uint8: " + new Uint8Array(filetype));
    console.log("file name uint8: " +  new Uint8Array(filename));

    //let rsaKP = await generateRSAkeys(rsaAlg); //Commented out for future use potentially with RSA key.
    let aesKy = await generateAESkey(aesAlg); // Generate AES key.
    let aesJWKString = await exportAesKeyToJWK(aesKy); //Edport AES key from crypto key.
    //let rsaJWK = await exportPublicRsaKey(rsaKP); //Commented out for future use potentially with RSA key.
    let filecrypted = await fileEncryptor(fileSent, aesKy, aesAlg); //Use crypto aes key to encrypt file.

    let filenamecrypted = await encryptor(filename, aesKy, aesAlg); //encrypt file name.
    console.log("FNC: " + new Uint8Array(filenamecrypted)); //For demo view log it out the raw binary of the encrypted name.
    let filemimecrypted = await encryptor(filetype, aesKy, aesAlg); //encrypt the file mime.

    //Base64 the raw binary strings.
    var b64cFN = btoa(new Uint8Array(filenamecrypted));
    var b64cFM = btoa(new Uint8Array(filemimecrypted));

    //Finally once all internal promises resolve return results.
    let finalResults = {
      filecrypted: filecrypted,
      filenamecrypted: b64cFN,
      filemimecrypted: b64cFM,
      key: aesJWKString,
      iv: ivExport
    };


  } catch (e) {
    console.log("An Error occured: " + e);
          console.log("An Error occured: " + JSON.stringify(e));
  } finally {
        return finalResults;
  }

}

//This function used to fetch and decrypt file, returning the original contents.
async function decryptFile(dataSent)
{
  //For Demo log it out the file data retrieved from the server.
  console.log("data: " + JSON.stringify(dataSent));
  var keySent = dataSent.key;
  console.log("dataSent iv: " + dataSent.iv);
  var decB64 = atob(dataSent.iv); //Decode the initialization vector.
  var iv = (decB64).split('-'); //Return it from string to array.
  console.log("iv string split: " + iv);
  var ivB = new Uint8Array(iv).buffer; //Convert array to binary buffer.

  //For demo purposes log out this data to console.
  console.log("uint8: " + ivB.toString());
  console.log("import key: " + keySent);

  try {

    let recvAES = await importAesKey(keySent); //Re-import aes key.

    //Fetch the file from the link to the google bucket, then convert it to a binary buffer.
    let responseBuffer = await (await fetch(dataSent.file.accessURL)).arrayBuffer();
    let decryptedFile = await fileDecryptor(responseBuffer, ivB, recvAES); //Decrypt the file.

    //For demo purposes log out the now decrypted binary file.
    console.log("decyrptedFile: " + new Uint8Array(decryptedFile));

    //For demo purposes log out the original file name / mime that are encoded b64 and encrypted.
    console.log("ofn: " + dataSent.file.originalName);
    console.log("ofm: " + dataSent.file.originalFileMime);

    //Debase64, transform the strings back into arrays.
    let b64dFN = atob(dataSent.file.originalName);
    let b64dFM = atob(dataSent.file.originalFileMime);
    var b64dFNbuffer = new Uint8Array(b64dFN.split(","));
    var b64dFMbuffer = new Uint8Array(b64dFM.split(","));

    //Decrypt the buffers back to original file name / mime.
    let decryptFileName = await decryptor(b64dFNbuffer, ivB, recvAES);
    let decryptFileMime = await decryptor(b64dFMbuffer, ivB, recvAES);

    //Finally after all promises resolve return the results.
    let finalResults =
    {
      fileDec: await decryptedFile,
      FRfilename: await decryptFileName,
      FRmime: await decryptFileMime
    };

    return await finalResults;

  } catch (e) {
      console.log("Something went wrong during webworker processing: " + e);
  } finally { }

}

/* Left in for future exploration, generation of a RSA key, returns a promise.*/
async function generateRSAkeys(rsaAlg)
{
    const rsaKeyPair = await crypto.subtle.generateKey(rsaAlg, true, ["encrypt", "decrypt"]);
    return rsaKeyPair;
}

/* Function used to generate a random aes-gcm key, returns a promise. */
async function generateAESkey(aesAlg)
{
    const aeskey = await crypto.subtle.generateKey(aesAlg, true, ["encrypt", "decrypt"]);
    return aeskey;
}

/* Function used to export aes key to readable format from webcrypto key, returns a promise. */
async function exportAesKeyToJWK(aesKey)
{
    const aesJWK = await crypto.subtle.exportKey("jwk", aesKey);
    return aesJWK;
}

//Left in for future exploration, used to export rsa keys public.
async function exportPublicRsaKey(rsaKP)
{
    const publicRSA = await crypto.subtle.exportKey("jwk", rsaKP.publicKey);
    return publicRSA;
}

//Function used to re-import the aes key from string, returns a promise.
async function importAesKey(stringkey)
{
  var aesJWK = {
    alg: "A256GCM",
    ext: true,
    k: stringkey,
    kty: "oct"
  };

  console.log("importing key: " + aesJWK.k);
    const aesKey = await crypto.subtle.importKey("jwk", aesJWK, "AES-GCM", true, ["encrypt","decrypt"]);
    return aesKey;
}

//Read the file pointer to a binary buffer, returns a promise.
async function fileread(file)
{
    const fileToRead = file;
    if(!fileToRead) return
    let filedata = await new Response(file).arrayBuffer();
    console.log("Original file:");
    console.log(filedata);
    return filedata;
}

//Generic encryptor for encrypting file name / mime
async function encryptor(fn, aeskey, aesAlg)
{
  return crypto.subtle.encrypt(aesAlg, aeskey, fn);
}

//Duplicate general decryptor used for decrypting the file name / mime
//two functions that are the same but allowed to be called at the same time
//by being seperate.
async function decryptor(cryptedbuf, iv, aesCryptoKey)
{
  var aesAlg = {
      name: "AES-GCM",
      length: 256,
      iv: new Uint8Array(iv)
  };

  return crypto.subtle.decrypt(aesAlg, aesCryptoKey, cryptedbuf).catch(function(error){
  console.log(error);
  });
}

//This function is used to encrypt a file returns a promise.
async function fileEncryptor(file, aeskey, aesAlg)
{
    if(typeof file != 'undefined')
    {
        let filecontents = await fileread(file[0]);
        let encryptedFile = crypto.subtle.encrypt(aesAlg, aeskey, filecontents);
        return encryptedFile;
    }

    return null;
}

//This function decrypts generic files and returns a promise.
async function fileDecryptor(buf, iv, aesCryptoKey)
{
  var aesAlg = {
      name: "AES-GCM",
      length: 256,
      iv: new Uint8Array(iv)
  };

  return crypto.subtle.decrypt(aesAlg, aesCryptoKey, buf).catch(function(error){
    console.log(error);
  });

}

/*http://qnimate.com/symmetric-encryption-using-web-cryptography-api/*/
function convertStringToArrayBufferView(str)
{
    var bytes = new Uint8Array(str.length);
    for (var iii = 0; iii < str.length; iii++)
    {
        bytes[iii] = str.charCodeAt(iii);
    }

    return bytes;
}

function convertArrayBufferViewtoString(buffer)
{
    var str = "";
    for (var iii = 0; iii < buffer.byteLength; iii++)
    {
        str += String.fromCharCode(buffer[iii]);
    }

    return str;
}

function convertBase64ToArrayBuffer(base64string) {
    var binary_string = atob(base64string);
    var len = binary_string.length;
    var bytes = new Uint8Array( len );
    for (var i = 0; i < len; i++)        {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
}
