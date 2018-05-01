import { Component, Output, EventEmitter, } from '@angular/core';
import { RequestFileService } from '@Services/FileRequestService/request-file.service';
import { Observable } from 'rxjs/Rx';
import * as workerPath from "file-loader?name=[name].js!../assets/File_Encrypt_Worker"; //Import web worker
import * as PromiseWorker from 'promise-worker-transferable'; //Import promise worker used to wrap web worker in a promise.

/* Import error message service used to create dynamic modal popups with error message */
import { ErrorMsgService } from '@Services/ErrorMsgService/error-msg.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent
{
  public ulCollapsed = true;
  public dlCollapsed = true;
  public showlink = false;
  public showfilelink = "";
  public fileName = "";
  public decryptfilelink = "";
  private filesSelected : FileList;
  public _this = this;

  private worker = new Worker(workerPath);

  //Inject two services into this class, requestfileservice handles file uplaods / downloads and returns a promise.
  //ErrorMsgService used to send messages to the error-model-dyn that dynamically binds and creates an error message modal.
  constructor(private _RequestFileService: RequestFileService, private _errorMsgData : ErrorMsgService ) {
  }

  //Toggles open the upload file section.
  toggleULFunction(isUlCollapsedStatus)
  {
    //For demo show the state of the collapsable.
    console.log(this.ulCollapsed);
    console.log("collapsed status " + isUlCollapsedStatus);
    this.ulCollapsed = !isUlCollapsedStatus;

    if(this.dlCollapsed == false)
    {
       this.dlCollapsed = !this.dlCollapsed;
    }

    return this.ulCollapsed;
  }

  //Toggles open the download file section.
  toggleDLFunction(isDlCollapsedStatus)
  {
    console.log(this.dlCollapsed);
    console.log("collapsed status " + isDlCollapsedStatus);
    this.dlCollapsed = !isDlCollapsedStatus;

    if(this.ulCollapsed == false)
    {
       this.ulCollapsed = !this.ulCollapsed;
    }

    return this.dlCollapsed;

  }

  //Function called when used clicks button to select a file to set the file selection.
  getFileInput(files: FileList)
  {
    console.log("File Selected: " + files.item(0).name);
    this.fileName = "Selected File: " + files.item(0).name;
    this.filesSelected = files;
  }

  //Command function for initiating file upload.
  startFileUpload()
  {
    //Limit client side file size to 2MegaBytes
    if( this.filesSelected.item(0).size > 2097152 )
    {
      this._errorMsgData.sendErrorUpdate({etype: 'File To Big ', reason: 'File Size must be below 2MB.'});
      return null;
    }

    //Construct a new promise worker.
    var promiseworker = new PromiseWorker(this.worker);

    //Demo purposes log out the selected file to console.
    console.log("File selected: " + this.filesSelected.item(0).name);

    //Message object construct to be passed to the worker, holding the command and file pointer selected.
    var filedata = {
      rt: 'ef',
      data: this.filesSelected,
    };

    //Demo purposes log out the data object sent to the worker.
    console.log("File data object sent: " + filedata);

    //Send the message to the worker, then when promise resolves, the file will be encrypted.
    promiseworker.postMessage(filedata).then((e) =>{
      //Demo purposes show returned data.
      console.log("Returned data" + JSON.stringify(e));
      console.log("file crypted data" + e.filecrypted);

      console.log("Base64 filename crypted: ");
      console.log(e.filenamecrypted);

      //Construct a new formData object and insert the encrypted data.
      //Blob of the encrypted file, encrypted file name, encrypted file mime.
      var formdata = new FormData();
      var blob = new Blob([e.filecrypted], {type: "application/octet-stream"});
      formdata.append('file', blob);

      var fn = e.filenamecrypted;
      var mm = e.filemimecrypted;

      formdata.append('originalfilename', fn);
      formdata.append('originalfilemime', mm);

      //Demo purposes log out crypted file name / mime.
      console.log("Cryptedfilename: " + e.filenamecrypted);
      console.log("Cryptedfilemime: " +  e.filemimecrypted);

      //Request the file upload, subscribe to the data state.
      //once the data is done being sent then, check the return data.
      this._RequestFileService.UploadFile('uploadfile', formdata).subscribe(
          data => {

            //If the server encounters an error it will send back NFE. with more details about the errors
            //this will then be shown in a modal popup.
            if( data.accessURL === 'NFE' )
            {
              this._errorMsgData.sendErrorUpdate(data);
              this.showfilelink = "";
              return null;
            }

            //Demo purposes log out the data returned and the file download link.
            console.log(data)
            console.log("e.key");
            console.log(e.key);

            //Finally set the generated file decryption link to be shown.
            this.showfilelink = data.fileRG.file_id + "?" + e.iv + "?" + e.key.k;
            this.showlink = true;
          },
          err => console.error(err)
        );

        console.log(this.showlink);
    }).catch(function(error){
      console.log(error);
    });
  }

  //Function called when used clicks button to decrypt a file.
  startFileDownload()
  {
    //construct new promise wraped aroudn the web worker.
    var promiseworker = new PromiseWorker(this.worker);
    //demo purposes logout the entered decryption link to console.
    console.log("String id: " + this.decryptfilelink);
    //Do some magic regex and strip white space from link entered.
    var strippedInput = (this.decryptfilelink.replace(/\s/g,''));
    var tokens = strippedInput.split('?',3); //Tokenize the decryption link
    console.log("tokens 1 " + tokens[0] + " tokens 2 " + tokens[2]);

    //Request file download using file request service, sending the UUID for the file.
    //Once the data returns ether show error message or begin file decryption.
    this._RequestFileService.RequstFile('downloadfile', tokens[0] ).subscribe(
        data => {
          console.log(data);

          if(data.accessURL === 'NFE')
          {
            this._errorMsgData.sendErrorUpdate(data);

            console.log("Bad Data Returned");
            this.decryptfilelink = "";
            return null;
          }

          //Constuct command object for web worker.
          //Command DF -  decrypt file, file is the google cloud data alink
          //key is the AES key, iv is the initialization vector.
          var message = {
            rt: 'df',
            file: data,
            key: tokens[2],
            iv: tokens[1]
          };

          //Post work to the webworker. Then once promise resolves handle saving file.
          promiseworker.postMessage(message).then((e) =>{

            var filenameString = this.arrayToString(new Uint8Array(e.FRfilename));
            var mimeString = this.arrayToString(new Uint8Array(e.FRmime));
            console.log("Mime: " + mimeString);
            var blob = new Blob([e.fileDec], {type: mimeString}); //
            var url = URL.createObjectURL(blob);

            const alink = document.createElement("a");
            alink.href = url;
            alink.target = "_self";
            alink.download = filenameString;
            document.body.appendChild(alink);
            alink.click();
            document.body.removeChild(alink);

          }).catch(function(error){
            console.log(error);
          });
        },

        err => console.error(err)
      );


  }

  //Function used to convert unit8 array to string.
  arrayToString(buf) {
    return String.fromCharCode.apply(null, new Uint16Array(buf));
  }

}
