import {ChangeDetectionStrategy, Component, effect, ElementRef, inject, OnInit, signal, viewChild} from '@angular/core';
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
import maplibregl, {Map, MapGeoJSONFeature, MapMouseEvent, StyleSpecification} from 'maplibre-gl';
import MaplibreGeocoder from '@maplibre/maplibre-gl-geocoder';
import {FrenchBanGeocoderApi} from '../../fr-ban-geocoder.api';

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
export class SearchInput implements OnInit {
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


  // search inpt
  readonly inputContainer = viewChild('inputContainer', {read: ElementRef})
  geocoder: MaplibreGeocoder | null = null

  constructor() {
    this.setupSearch();

    effect(() => {
      const map = this.map()
      if (map) {
        const el = this.geocoder?.onAdd(map);
        this.inputContainer()?.nativeElement.appendChild(el)
      }
    });
  }

  ngOnInit(): void {
    this.geocoder = new MaplibreGeocoder(FrenchBanGeocoderApi, {
      showResultsWhileTyping: true,
      minLength: 4,
      placeholder: 'Enter an address or coordinates',
      render: item => {
        return (
          '<div class="maplibregl-ctrl-geocoder--result">' +
          '<svg class="maplibregl-ctrl-geocoder--result-icon" viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 0C5.36571 0 0 5.38676 0 12.0471C0 21.0824 12 32 12 32C12 32 24 21.0824 24 12.0471C24 5.38676 18.6343 0 12 0ZM12 16.3496C9.63428 16.3496 7.71429 14.4221 7.71429 12.0471C7.71429 9.67207 9.63428 7.74454 12 7.74454C14.3657 7.74454 16.2857 9.67207 16.2857 12.0471C16.2857 14.4221 14.3657 16.3496 12 16.3496Z" fill="#687078"/></svg>' +
          "<div>" +
          '<div class="maplibregl-ctrl-geocoder--result-title">' +
          item.place_name +
          "</div>" +
          '<div class="maplibregl-ctrl-geocoder--result-address">' +
          item.text +
          "</div>" +
          "</div>" +
          "</div>"
        );
      },
      maplibregl
    })
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
