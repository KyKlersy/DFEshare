import { TestBed, inject } from '@angular/core/testing';

import { ErrorMsgServiceService } from './error-msg.service';

describe('ErrorMsgServiceService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ErrorMsgServiceService]
    });
  });

  it('should be created', inject([ErrorMsgServiceService], (service: ErrorMsgServiceService) => {
    expect(service).toBeTruthy();
  }));
});
