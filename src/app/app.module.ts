import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

/* Service Imports */
import { RequestFileService } from '@Services/FileRequestService/request-file.service';
import { ErrorMsgService } from '@Services/ErrorMsgService/error-msg.service';

/* Component Imports */
import { AppComponent } from './app.component';
import { ErrorModalDynComponent, NgbdModalContent} from './error-modal-dyn/error-modal-dyn.component';


@NgModule({
  declarations: [
    AppComponent,
    ErrorModalDynComponent,
    NgbdModalContent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    NgbModule.forRoot()
  ],
  entryComponents: [NgbdModalContent],
  providers: [RequestFileService, ErrorMsgService],
  bootstrap: [AppComponent]
})

export class AppModule { }
