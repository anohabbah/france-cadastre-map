import {ChangeDetectionStrategy, Component, computed, effect, inject, signal} from '@angular/core';
import {EventData, NgxMapLibreGLModule} from '@maplibre/ngx-maplibre-gl';
import vectorStyle from './styles/vector.json';
import maplibregl, {Map, MapGeoJSONFeature, MapMouseEvent, StyleSpecification} from 'maplibre-gl';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatAutocompleteModule, MatAutocompleteSelectedEvent} from '@angular/material/autocomplete';
import {MatInputModule} from '@angular/material/input';
import {SearchAddress} from './services/search-address';
import {FormControl, ReactiveFormsModule} from '@angular/forms';
import {toSignal} from '@angular/core/rxjs-interop';
import {debounceTime, distinctUntilChanged, filter, switchMap} from 'rxjs';
import {Address} from '@lib/geocode';
import {MAT_SNACK_BAR_DATA, MatSnackBar} from '@angular/material/snack-bar';
import MaplibreGeocoder from '@maplibre/maplibre-gl-geocoder';
import {FrenchBanGeocoderApi} from './fr-ban-geocoder.api';

const zoomLevel = {
  street: 16,
  address: 16,
  locality: 17,
  housenumber: 18,
  municipality: 13,
}

@Component({
  selector: 'cdst-root',
  imports: [NgxMapLibreGLModule, MatFormFieldModule, MatAutocompleteModule, MatInputModule, ReactiveFormsModule],
  templateUrl: './app.html',
  host: {
    class: 'w-full h-full block relative'
  },
})
export class App {
  private readonly searchAddress = inject(SearchAddress);
  private readonly snackbar = inject(MatSnackBar);

  readonly mapStyle = vectorStyle as StyleSpecification;
  readonly query = new FormControl<string>('', {nonNullable: true});
  readonly result = toSignal(
    this.query.valueChanges.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      filter(query => query.trim().length > 2),
      switchMap(query => this.searchAddress.searchAddresses(query))
    ),
    {initialValue: []}
  );

  readonly placeholder = signal('Rechercher une adresse...')

  readonly map = signal<Map | null>(null)

  readonly cursor = signal('default')
  readonly hoveredInfo = signal<{ longitude: number, latitude: number, feature: any } | null>(null)
  readonly selectedParcelle = signal<any>(null)

  readonly displayPopup = computed(() => {
    if (this.hoveredInfo()) {
      const {id} = this.selectedParcelle() || {};
      return id !== this.hoveredInfo()?.feature.properties.id
    }
    return false
  })

  constructor() {
    effect(() => {
      const {id} = this.selectedParcelle() || {};
      this.map()?.setFilter('parcelle-highlighted', ['==', 'id', id || ''])
    });
    effect(() => {
      this.map()?.addControl(new MaplibreGeocoder(FrenchBanGeocoderApi, {
        showResultsWhileTyping: true,
        render: item => `
        <div>
          <div class="font-medium">${item.place_name}</div>
          <div class="text-xs text-gray-500">${item.text}</div>
        </div>
        `,
        maplibregl
      }), 'top-left')
    })
  }

  protected displayWith(address: Address): string {
    return address.properties?.label ?? ''
  }

  protected handleSelection(event: MatAutocompleteSelectedEvent) {
    const address = event.option.value as Address;
    console.log({address})
    this.placeholder.set(address.properties?.label ?? '')
    this.map()?.setCenter((address.geometry?.coordinates ?? [2.213749, 46.227638]) as [number, number])
    this.map()?.setZoom(zoomLevel[address.properties?.type ?? 'municipality'])
    this.query.setValue('')
    this.selectedParcelle.set(null)
  }

  protected onHover(event: MapMouseEvent & { features?: MapGeoJSONFeature[]; } & EventData) {
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

  protected handleSelectParcelle(event: MapMouseEvent & { features?: MapGeoJSONFeature[] } & EventData) {
    event.originalEvent.stopPropagation()
    const feature = event["features"]?.[0];
    const {id} = this.selectedParcelle() || {};
    if (feature && id !== feature.properties["id"]) {
      this.selectedParcelle.set({...feature.properties})
      this.snackbar.openFromComponent(SelectedParcelDetails, {
        data: {
          ...this.selectedParcelle(),
          ...event.lngLat,
        }
      })
    } else {
      this.selectedParcelle.set(null)
    }
  }
}

@Component({
  template: `
    <div>
      <div>
        <b>Parcelle </b>
        <span>{{ selectedParcelle?.numero }}</span>
      </div>
      <div>
        <b>Longitude </b>
        <span>{{ selectedParcelle?.lng }}</span>
      </div>
      <div>
        <b>Latitude </b>
        <span>{{ selectedParcelle?.lat }}</span>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
class SelectedParcelDetails {
  readonly selectedParcelle = inject<any>(MAT_SNACK_BAR_DATA)
}
