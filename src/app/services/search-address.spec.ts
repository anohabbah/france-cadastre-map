import { TestBed } from '@angular/core/testing';

import { SearchAddress } from './search-address';

describe('SearchAddress', () => {
  let service: SearchAddress;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SearchAddress);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
