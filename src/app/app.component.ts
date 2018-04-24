import { Component } from '@angular/core';
import { RequestFileService } from './Services/request-file.service';
import { Observable } from 'rxjs/Rx';
import * as workerPath from "file-loader?name=[name].js!../assets/File_Encrypt_Worker";
import * as PromiseWorker from 'promise-worker-transferable';


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


  constructor(private _RequestFileService: RequestFileService) {
  }


  toggleULFunction(isUlCollapsedStatus)
  {
    console.log(this.ulCollapsed);
    console.log("collapsed status " + isUlCollapsedStatus);
    this.ulCollapsed = !isUlCollapsedStatus;

    if(this.dlCollapsed == false)
    {
       this.dlCollapsed = !this.dlCollapsed;
    }

    return this.ulCollapsed;
  }

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

  getFileInput(files: FileList)
  {
    console.log("File Selected: " + files.item(0).name);
    this.fileName = "Selected File: " + files.item(0).name;
    this.filesSelected = files;
  }

  uploadFile(e)
  {
    this._RequestFileService.UploadFile('/uploadfile', e).subscribe(
      res => {
        console.log(res);
      },
      err => {
        console.log("Err" + err);
      }
    );
  }

  startFileUpload()
  {

    var promiseworker = new PromiseWorker(this.worker);
    console.log("File selected: " + this.filesSelected.item(0).name);

    var filedata = {
      rt: 'ef',
      data: this.filesSelected,
    };

    console.log("File data object sent: " + filedata);

    promiseworker.postMessage(filedata).then((e) =>{
      console.log("Returned data" + JSON.stringify(e));
      console.log("file crypted data" + e.filecrypted);


      console.log("Base64 filename crypted: ");
      console.log(e.filenamecrypted);



      var formdata = new FormData();
      var blob = new Blob([e.filecrypted], {type: "application/octet-stream"});
      formdata.append('file', blob);


      var fn = e.filenamecrypted;
      var mm = e.filemimecrypted;

      formdata.append('originalfilename', fn);
      formdata.append('originalfilemime', mm);


      console.log("Cryptedfilename: " + e.filenamecrypted);
      console.log("Cryptedfilemime: " +  e.filemimecrypted);

      this._RequestFileService.UploadFile('uploadfile', formdata).subscribe(
          data => {
            console.log(data)
            console.log("e.key");
            console.log(e.key);

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

  startFileDownload()
  {
    var promiseworker = new PromiseWorker(this.worker);
    console.log("String id: " + this.decryptfilelink);
    var strippedInput = (this.decryptfilelink.replace(/\s/g,''));
    var tokens = strippedInput.split('?',3);
    console.log("tokens 1 " + tokens[0] + " tokens 2 " + tokens[2]);

    this._RequestFileService.RequstFile('downloadfile', tokens[0] ).subscribe(
        data => {
          console.log(data);

          if(data.accessURL === 'NFE')
          {
            console.log("Bad Data Returned");
            this.decryptfilelink = data.reason;
            return null;
          }

          var message = {
            rt: 'df',
            file: data,
            key: tokens[2],
            iv: tokens[1]
          };


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

              /* Todo make api call confirming dl */

            }).catch(function(error){
              console.log(error);
            });
        },

        err => console.error(err)
      );


  }

  arrayToString(buf) {
    return String.fromCharCode.apply(null, new Uint16Array(buf));
  }

}
