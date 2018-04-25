import { Component, Input } from '@angular/core';

import {NgbModal, NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';

import { ErrorMsgService } from '@Services/ErrorMsgService/error-msg.service';

@Component({
  selector: 'ngbd-modal-content',
  template: `
    <div class="modal-header">
      <h4 class="modal-title">{{ErrorType}}</h4>
      <button type="button" class="close" aria-label="Close" (click)="activeModal.dismiss('Cross click')">
        <span aria-hidden="true">&times;</span>
      </button>
    </div>
    <div class="modal-body">
      <p>{{ErrorReason}}</p>
    </div>
    <div class="modal-footer">
      <button type="button" class="btn btn-outline-primary" (click)="activeModal.close('Close click')">Close</button>
    </div>
  `
})
export class NgbdModalContent {
  @Input() ErrorType;
  @Input() ErrorReason;

  constructor(public activeModal: NgbActiveModal) {}
}

@Component({
  selector: 'app-error-modal-dyn',
  templateUrl: './error-modal-dyn.component.html'
})
export class ErrorModalDynComponent {
  constructor(private modalService: NgbModal, private _errorMsgData : ErrorMsgService) {}

  open(ResponseErrorMsg) {

    const modalRef = this.modalService.open(NgbdModalContent, { centered: true, keyboard: false, backdrop: 'static' });
    modalRef.componentInstance.ErrorType = ResponseErrorMsg.etype;
    modalRef.componentInstance.ErrorReason = ResponseErrorMsg.reason;
  }

  ngOnInit()
  {
    this._errorMsgData.listenErrMsg().subscribe((errMsg : any) =>{
      this.open(errMsg);
      console.log("Errmsg from service: " + errMsg);
    });
  }
}
