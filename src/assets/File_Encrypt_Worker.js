
importScripts('https://unpkg.com/promise-worker-transferable@1.0.4/dist/promise-worker.register.min.js');


registerPromiseWorker(function(message){



  if(message.rt === 'ef')
  {

    return encryptFile(message.data);
  }
  else if(message.rt === 'df')
  {

    /*Fetch and Decrypt file using provided link and key. */
    //console.log("data sent: " + JSON.stringify(message));
    return decryptFile(message);
  }

});

async function encryptFile(fileSent)
{

  var enc = new TextEncoder('utf-8');
  const rsaAlg = {
      name: "RSA-OAEP",
      hash: "SHA-256",
      publicExponent: new Uint8Array([1, 0, 1]),
      modulusLength: 2048
  };

  var iv = crypto.getRandomValues(new Uint8Array(12));
  var ivstring = iv.toString();
  var ivReplace = ivstring.replace(/,/g,"-");
  var ivExport = btoa(ivReplace);
  console.log(iv.toString());
  console.log(ivExport);



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

    let rsaKP = await generateRSAkeys(rsaAlg);
    let aesKy = await generateAESkey(aesAlg);
    let aesJWKString = await exportAesKeyToJWK(aesKy);
    let rsaJWK = await exportPublicRsaKey(rsaKP);
    let filecrypted = await fileEncryptor(fileSent, aesKy, aesAlg);

    let filenamecrypted = await encryptor(filename, aesKy, aesAlg);
    console.log("FNC: " + new Uint8Array(filenamecrypted));
    let filemimecrypted = await encryptor(filetype, aesKy, aesAlg);

    var b64cFN = btoa(new Uint8Array(filenamecrypted));
    var b64cFM = btoa(new Uint8Array(filemimecrypted));

    let finalResults = {
      filecrypted: filecrypted,
      filenamecrypted: b64cFN,
      filemimecrypted: b64cFM,
      key: aesJWKString,
      iv: ivExport
    };


  } catch (e) {
    console.log("Fucking fuck: " + e);
          console.log("Fucking fuck: " + JSON.stringify(e));
  } finally {
        return finalResults;
  }

}

async function decryptFile(dataSent)
{


  console.log("data: " + JSON.stringify(dataSent));
  var keySent = dataSent.key;
  console.log("dataSent iv: " + dataSent.iv);
  var decB64 = atob(dataSent.iv);
  var iv = (decB64).split('-');
  console.log("iv string split: " + iv);
  var ivB = new Uint8Array(iv).buffer;

  console.log("uint8: " + ivB.toString());

  console.log("import key: " + keySent);


  try {

    let recvAES = await importAesKey(keySent);
    let responseBuffer = await (await fetch(dataSent.file.accessURL)).arrayBuffer();
    let decryptedFile = await fileDecryptor(responseBuffer, ivB, recvAES);

    console.log("decyrptedFile: " + new Uint8Array(decryptedFile));

    console.log("ofn: " + dataSent.file.originalName);
    console.log("ofm: " + dataSent.file.originalFileMime);

    let b64dFN = atob(dataSent.file.originalName);
    let b64dFM = atob(dataSent.file.originalFileMime);
    var b64dFNbuffer = new Uint8Array(b64dFN.split(","));
    var b64dFMbuffer = new Uint8Array(b64dFM.split(","));

    let decryptFileName = await decryptor(b64dFNbuffer, ivB, recvAES);
    let decryptFileMime = await decryptor(b64dFMbuffer, ivB, recvAES);

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

async function generateRSAkeys(rsaAlg)
{
    const rsaKeyPair = await crypto.subtle.generateKey(rsaAlg, true, ["encrypt", "decrypt"]);
    return rsaKeyPair;
}

async function generateAESkey(aesAlg)
{
    const aeskey = await crypto.subtle.generateKey(aesAlg, true, ["encrypt", "decrypt"]);
    return aeskey;
}

async function exportAesKeyToJWK(aesKey)
{
    const aesJWK = await crypto.subtle.exportKey("jwk", aesKey);
    return aesJWK;
}

async function exportPublicRsaKey(rsaKP)
{
    const publicRSA = await crypto.subtle.exportKey("jwk", rsaKP.publicKey);
    return publicRSA;
}

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

async function rsaSign()
{

}

async function fileread(file)
{
    const fileToRead = file;
    if(!fileToRead) return
    let filedata = await new Response(file).arrayBuffer();
    console.log("Original file:");
    console.log(filedata);
    return filedata;
}

async function encryptor(fn, aeskey, aesAlg)
{
  return crypto.subtle.encrypt(aesAlg, aeskey, fn);
}

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
