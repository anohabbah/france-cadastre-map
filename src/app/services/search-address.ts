import {inject, Injectable} from '@angular/core';
import {Address, AddressPropertiesTypeEnum, GeometryPointTypeEnum, SearchService} from '@lib/geocode';
import {map, Observable} from 'rxjs';
import * as zod  from "zod/mini";

const AddressSchema = zod.object({
  id: zod.string(),
  label: zod.string(),
  context: zod.string(),
  type: zod.enum(AddressPropertiesTypeEnum),
})
const AddressResponseSchema = zod.object({
  properties: AddressSchema,
  geometry: zod.object({
    type: zod.enum(GeometryPointTypeEnum),
    coordinates: zod.tuple([zod.number(), zod.number()]),
  })
})


@Injectable({
  providedIn: 'root'
})
export class SearchAddress {
  private readonly searchService = inject(SearchService)

  public searchAddresses(query: string): Observable<Address[]> {
    return this.searchService.search(query).pipe(map(res => zod.array(AddressResponseSchema).parse(res.features ?? [])))
  }
}
