import { TestBed, inject } from '@angular/core/testing';

import { RequestFileService } from './request-file.service';

describe('RequestFileService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RequestFileService]
    });
  });

  it('should be created', inject([RequestFileService], (service: RequestFileService) => {
    expect(service).toBeTruthy();
  }));
});
