import { Component } from '@angular/core';
import { RequestFileService } from './Services/request-file.service';
import { Observable } from 'rxjs/Rx';
import * as workerPath from "file-loader?name=[name].js!../assets/File_Encrypt_Worker";
import * as PromiseWorker from 'promise-worker-transferable';
//var registerPromiseWorker = require('promise-worker-transferable/register');

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
    //files.item(0).name
    console.log("File selected: " + this.filesSelected.item(0).name);

    var worker = new Worker(workerPath);
    var promiseworker = new PromiseWorker(worker);
    var filedata = {
      rt: 'ef',
      data: this.filesSelected
    };

    console.log("File data object sent: " + filedata);
    promiseworker.postMessage(filedata).then((e) =>{
      console.log("Returned data" + e);
      console.log("file crypted data" + e.filecrypted);
      console.log("In uint8: " + new Uint8Array(e.filecrypted));

      console.log(e.filecrypted);



      var formdata = new FormData();
      var blob = new Blob([e.filecrypted], {type: "application/octet-stream"});
      formdata.append('file', blob);
      //formdata.append('originalfilename', e.filenamecrypted);
      formdata.append('originalfilename', new Uint8Array(e.filenamecrypted).toString());
      formdata.append('originalfilemime', new Uint8Array(e.filemimecrypted).toString());
      console.log("Cryptedfilename: " + new Uint8Array(e.filenamecrypted));
      console.log("Cryptedfilemime: " +  new Uint8Array(e.filemimecrypted))

      this._RequestFileService.UploadFile('uploadfile', formdata).subscribe(
          data => {
            console.log(data)
            this.showfilelink = data.fileRG.file_id;
            this.showlink = true;
          },
          err => console.error(err)
        );

        console.log(this.showlink);
    }).catch(function(error){
      console.log(error);
    });

    /*promiseworker.postMessage(filedata).then(function (e){
      console.log("Returned data" + e);
      console.log("file crypted data" + e.filecrypted);
      console.log("In uint8: " + new Uint8Array(e.filecrypted));

      var formdata = new FormData();
      formdata.append('file', e.filecrypted);

      _this.uploadFile('/uploadfile', formdata).subscribe(
          data => { console.log(data)},
          err => console.error(err)
        );

    }).catch(function(error){
      console.log(error);
    });*/





    //console.log(workerPath, worker);

    //worker.addEventListener('message', function(e){

        //uploadFile(e);




      /*console.log(e.data.fileDec);
      var blob = new Blob([e.data.fileDec], {type: "text/plain;charset=utf-8"}); //
      var url = URL.createObjectURL(blob);

      const alink = document.createElement("a");
      alink.href = url;
      alink.target = "_self";
      alink.download = "dltext.txt";
      document.body.appendChild(alink);
      alink.click();
      document.body.removeChild(alink);*/

    //},false);


    //worker.postMessage(this.filesSelected);

  }

  startFileDownload()
  {
    console.log("String id: " + this.decryptfilelink);
    this._RequestFileService.RequstFile('downloadfile', (this.decryptfilelink.replace(/\s/g,''))).subscribe(
        data => {
          console.log(data)
        },
        err => console.error(err)
      );


  }


}
