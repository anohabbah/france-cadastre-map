import {ChangeDetectionStrategy, Component, inject, signal} from '@angular/core';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatAutocompleteModule} from '@angular/material/autocomplete';
import {MatInputModule} from '@angular/material/input';
import {FormControl, ReactiveFormsModule} from '@angular/forms';
import {catchError, debounceTime, distinctUntilChanged, Observable, of, switchMap, tap} from 'rxjs';
import vector from '../../styles/vector.json';
import {Location, MapService} from '../../geocoder/map.service';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatIconModule} from '@angular/material/icon';
import {EventData, NgxMapLibreGLModule} from '@maplibre/ngx-maplibre-gl';
import {Map, MapGeoJSONFeature, MapMouseEvent, StyleSpecification} from 'maplibre-gl';

const FRANCE_CENTER: [number, number] = [2.2137, 46.2276]; // Center of France
const DEFAULT_ZOOM = 5;
const MAP_STYLE = vector as StyleSpecification;

@Component({
  selector: 'app-custom-search-input-page',
  templateUrl: './search-input.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'flex flex-col sm:flex-row h-full overflow-y-auto',
  },
  imports: [
    MatFormFieldModule,
    MatAutocompleteModule,
    MatInputModule,
    ReactiveFormsModule,
    MatProgressSpinnerModule,
    MatIconModule,
    NgxMapLibreGLModule,
  ],
})
export class SearchInput {
  private readonly mapService = inject(MapService);

  readonly searchControl = new FormControl('');
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly options = signal<Location[]>([]);

  // Map settings
  readonly mapStyle = signal(MAP_STYLE);
  readonly center = signal<[number, number]>(FRANCE_CENTER);
  readonly zoom = signal(DEFAULT_ZOOM);
  readonly userLocation = signal<[number, number] | null>(null);
  readonly cursor = signal('default');
  readonly hoveredInfo = signal<{ longitude: number, latitude: number, feature: any } | null>(null)
  readonly map = signal<Map | null>(null)
  readonly selectedParcelle = signal<any>(null)

  constructor() {
    this.setupSearch();
  }

  private setupSearch(): void {
    this.searchControl.valueChanges
      .pipe(
        tap(() => this.isLoading.set(true)),
        debounceTime(400),
        distinctUntilChanged(),
        switchMap((query) => this.searchAddress(query || '')),
        catchError((err) => {
          console.error('Search error:', err);
          this.error.set('Failed to load search results');
          this.isLoading.set(false);
          return of([]);
        })
      )
      .subscribe((locations) => {
        this.options.set(locations);
        this.isLoading.set(false);
      });
  }

  private searchAddress(query: string): Observable<Location[]> {
    if (typeof query === 'object' || query.trim().length < 3) {
      return of([]);
    }
    return this.mapService.searchAddress(query);
  }

  onSelectLocation(location: Location): void {
    this.center.set([location.coordinates[0], location.coordinates[1]]);
    this.zoom.set(17);
  }

  displayFn(location: Location): string {
    return location?.label || '';
  }

  protected handleSelectParcelle(event: MapMouseEvent & EventData) {
    event.originalEvent.stopPropagation()
    const feature = event["features"]?.[0];
    const {id} = this.selectedParcelle() || {};
    if (feature && id !== feature.properties["id"]) {
      this.selectedParcelle.set({...feature.properties})
    } else {
      this.selectedParcelle.set(null)
    }
  }

  protected onHover(event: MapMouseEvent & { features?: MapGeoJSONFeature[] } & EventData) {
    event.originalEvent.stopPropagation();
    const feature = event.features?.[0]
    const longitude = event.lngLat.lng
    const latitude = event.lngLat.lat
    let hoverInfo = null
    if (feature) {
      hoverInfo = {
        longitude,
        latitude,
        feature
      }
    }
    this.hoveredInfo.set(hoverInfo)

    this.map()?.setFilter('parcelle-highlighted', ['==', 'id', (event as any).features?.[0]?.properties?.id ?? ''])
  }

  protected onLeave() {
    this.cursor.set('default')
    this.map()?.setFilter('parcelle-highlighted', ['==', 'id', ''])
  }
}

export default SearchInput;
