// import { Component, OnInit, ViewEncapsulation } from '@angular/core';
// import { FormsModule, ReactiveFormsModule } from '@angular/forms';
// import {NgbModal, ModalDismissReasons} from '@ng-bootstrap/ng-bootstrap';
//
// @Component({
//   selector: 'app-error-model',
//   templateUrl: './error-model.component.html',
//   encapsulation: ViewEncapsulation.None,
//   styleUrls: ['./error-model.component.css']
// })
// export class ErrorModelComponent implements OnInit {
//
//   closeResult: string;
//
//   constructor(private modalService: NgbModal) { }
//
//   ngOnInit() {
//   }
//
//   open(content) {
//     this.modalService.open(content, { centered: true }).result.then((result) => {
//       this.closeResult = `Closed with: ${result}`;
//     }, (reason) => {
//       this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
//     });
//
//     console.log(this.closeResult);
//   }
//
//   private getDismissReason(reason: any): string {
//     if (reason === ModalDismissReasons.ESC) {
//       return 'by pressing ESC';
//     } else if (reason === ModalDismissReasons.BACKDROP_CLICK) {
//       return 'by clicking on a backdrop';
//     } else {
//       return  `with: ${reason}`;
//     }
//   }
//
// }
