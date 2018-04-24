import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { RequestFileService } from './Services/request-file.service';

import { AppComponent } from './app.component';
import { ErrorModelComponent } from './error-model/error-model.component';


@NgModule({
  declarations: [
    AppComponent,
    ErrorModelComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    NgbModule.forRoot()
  ],
  providers: [RequestFileService],
  bootstrap: [AppComponent]
})

export class AppModule { }
