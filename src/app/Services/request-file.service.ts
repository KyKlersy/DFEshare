import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';

@Injectable()
export class RequestFileService {

  constructor(private http:HttpClient) { }

  public RequstFile(apiPath, fileid) : Observable<any> {
    var urlbase = window.location.href;
    var fullApiPath = urlbase + apiPath;
    const body = {
        fileid
    }

    return this.http.post(fullApiPath, body);
  }

  public UploadFile(apiPath, formData) : Observable<any> {
    var urlbase = window.location.href;
    var fullApiPath = urlbase + apiPath;
    console.log(fullApiPath);
    return this.http.post(fullApiPath, formData);
  }

}
