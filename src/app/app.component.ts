import { Component } from '@angular/core';
import * as workerPath from "file-loader?name=[name].js!../assets/File_Encrypt_Worker";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent 
{
  public ulCollapsed = true;
  public dlCollapsed = true;
  public fileName = "";
  private filesSelected : FileList;


  constructor()
  {   
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


  startFileUpload()
  {

    

    const worker = new Worker(workerPath);
    console.log(workerPath, worker);

    worker.addEventListener('message', function(e){
      console.log(e.data.fileDec);
      var blob = new Blob([e.data.fileDec], {type: "text/plain;charset=utf-8"}); //
      var url = URL.createObjectURL(blob);
      
      const alink = document.createElement("a");
      alink.href = url;
      alink.target = "_self";
      alink.download = "dltext.txt";
      document.body.appendChild(alink);
      alink.click();
      document.body.removeChild(alink);

    },false);


    worker.postMessage(this.filesSelected);

  }
  

  


  

  

}
