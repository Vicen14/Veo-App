import { TestBed } from '@angular/core/testing';

import { Dbservice } from './dbservice';

describe('Dbservice', () => {
  let service: Dbservice;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Dbservice);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
