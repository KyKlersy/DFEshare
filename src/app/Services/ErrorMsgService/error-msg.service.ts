import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';

@Injectable()
export class ErrorMsgService {
  private data = new Subject<any>();
  constructor() { }

  listenErrMsg(): Observable<any>{
    return this.data.asObservable();
  }

  sendErrorUpdate(errorMsg : any)
  {
    this.data.next(errorMsg);
  }

}
