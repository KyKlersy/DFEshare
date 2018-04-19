
importScripts('https://unpkg.com/promise-worker-transferable@1.0.4/dist/promise-worker.register.min.js');


registerPromiseWorker(function(message){
  if(message.rt === 'ef')
  {
    console.log(message);
    return encryptFile(message.data);
  }

});

async function encryptFile(fileSent)
{
  var enc = new TextEncoder();
    const rsaAlg = {
        name: "RSA-OAEP",
        hash: "SHA-256",
        publicExponent: new Uint8Array([1, 0, 1]),
        modulusLength: 2048
    };

    var iv = crypto.getRandomValues(new Uint8Array(12));

    const aesAlg = {
        name: "AES-GCM",
        length: 256,
        iv: iv,
    };

    //var fl = Array.from(fileSent);

    //console.log("file sent: " + fileSent);
    //console.log("file list: " + fl);
    //console.log("file name: " + fileSent.item(0).name);

    //console.log("file mime: " + fileSent.item(0).type);

    let rsaKP = await generateRSAkeys(rsaAlg);
    let aesKy = await generateAESkey(aesAlg);
    let aesJWKString = await exportAesKeyToJWK(aesKy);
    let rsaJWK = await exportPublicRsaKey(rsaKP);
    let filecrypted = await fileEncryptor(fileSent, aesKy, aesAlg);
    let filenamecrypted = await encryptor((enc.encode(fileSent.item(0).name)), aesKy, aesAlg);
    let filemimecrypted = await encryptor((enc.encode(fileSent.item(0).type)), aesKy, aesAlg);
    //let finalResults = [rsaKP, aesKy, iv, aesJWKString, rsaJWK, filecrypted];
    let finalResults = {
      filecrypted: filecrypted,
      filenamecrypted: filenamecrypted,
      filemimecrypted: filemimecrypted,
      key: aesKy
    };
    return finalResults;


    //return filecrypted;
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

async function importAesKey(aesJWK)
{
    const aesKey = await crypto.subtle.importKey("jwk", aesJWK, "AES-GCM", true, ["decrypt"]);
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
  if(typeof fn != 'undefined')
  {
    let encrypted = crypto.subtle.encrypt(aesAlg, aeskey, fn);
    return encrypted;
  }
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
    const aesAlg = {
        name: "AES-GCM",
        length: 256,
        iv: iv
    };

    let decryptedFile = await crypto.subtle.decrypt(aesAlg, aesCryptoKey, buf);
    return decryptedFile;
}



/*self.addEventListener('message', function(e)
{

    var fileSent = e.data;




    encryptFile(fileSent).then((rsakey) =>{
        console.log(rsakey[2]);
        console.log(rsakey[3]);
        console.log(rsakey[4]);
        console.log(rsakey[5]);

        importAesKey(rsakey[3]).then((key) =>{


            console.log("AES crypto key: " + key);

            fileDecryptor(rsakey[5], rsakey[2], key).then((decyrpted)=>{
                console.log(decyrpted);
                self.postMessage({fileDec: decyrpted});

            })
        })

    })

}, false);*/
