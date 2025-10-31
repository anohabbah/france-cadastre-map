import {inject, Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {map, Observable} from 'rxjs';

const BAN_API_URL = 'https://api-adresse.data.gouv.fr/search';

@Injectable({
  providedIn: 'root',
})
export class MapService {
  private readonly http = inject(HttpClient);

  searchAddress(query: string): Observable<Location[]> {
    const params = new HttpParams()
      .set('q', query)
      .set('limit', '5')
      .set('autocomplete', '1');

    return this.http.get<SearchResult>(BAN_API_URL, {params}).pipe(
      map((result) =>
        result.features.map((feature) => ({
          type: 'Point',
          coordinates: feature.geometry.coordinates,
          label: feature.properties.label,
          context: feature.properties.context,
          score: feature.properties.score,
        }))
      )
    );
  }

}

export interface Location {
  type: 'Point';
  coordinates: [number, number];
  label: string;
  context: string;
  score: number;
}

export interface SearchResult {
  features: Array<{
    type: string;
    geometry: {
      type: string;
      coordinates: [number, number];
    };
    properties: {
      label: string;
      score: number;
      city: string;
      postcode: string;
      context: string;
    };
  }>;
}
