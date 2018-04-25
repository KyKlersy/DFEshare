import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ErrorModalDynComponent } from './error-modal-dyn.component';

describe('ErrorModalDynComponent', () => {
  let component: ErrorModalDynComponent;
  let fixture: ComponentFixture<ErrorModalDynComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ErrorModalDynComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ErrorModalDynComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
