import {Component, computed, effect, inject, signal} from '@angular/core';
import {EventData, NgxMapLibreGLModule} from '@maplibre/ngx-maplibre-gl';
import vectorStyle from './styles/vector.json';
import {
  StyleSpecification,
  Map,
  FilterSpecification,
  GeoJSONFeature,
  MapMouseEvent,
  MapGeoJSONFeature
} from 'maplibre-gl';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatAutocompleteModule, MatAutocompleteSelectedEvent} from '@angular/material/autocomplete';
import {MatInputModule} from '@angular/material/input';
import {SearchAddress} from './services/search-address';
import {FormControl, ReactiveFormsModule} from '@angular/forms';
import {toSignal} from '@angular/core/rxjs-interop';
import {debounceTime, distinctUntilChanged, filter, switchMap} from 'rxjs';
import {Address} from '@lib/geocode';
import * as maplibre_gl from 'maplibre-gl';

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
  }
})
export class App {
  private readonly searchAddress = inject(SearchAddress);

  readonly mapStyle = vectorStyle as StyleSpecification;
  readonly query = new FormControl<string>('', {nonNullable: true});
  readonly result = toSignal(
    this.query.valueChanges.pipe(
      distinctUntilChanged(),
      filter(query => query.length >= 3),
      debounceTime(400),
      switchMap(query => this.searchAddress.searchAddresses(query))
    ),
    {initialValue: []}
  );

  readonly placeholder = signal('Rechercher une adresse...')

  map: Map | undefined;

  readonly cursor = signal('default')
  readonly hoveredInfo = signal<{ longitude: number, latitude: number, feature: any } | null>(null)
  readonly selectedParcelle = signal<any>(null)

  readonly displayPopup = computed(() => {
    if (this.hoveredInfo()) {
      const { id } = this.selectedParcelle() || {};
      return id === this.hoveredInfo()?.feature.properties.id
    }
    return false
  })

  constructor() {
    effect(() => {
      const { id } = this.selectedParcelle();
      this.map?.setFilter('parcelle-highlighted', ['==', 'id', id || ''])
    });
  }

  displayWith(address: Address): string {
    return address.properties?.label ?? ''
  }

  protected handleSelection(event: MatAutocompleteSelectedEvent) {
    const address = event.option.value as Address;
    console.log({address})
    this.placeholder.set(address.properties?.label ?? '')
    this.map?.setCenter((address.geometry?.coordinates ?? [2.213749, 46.227638]) as [number, number])
    this.map?.setZoom(zoomLevel[address.properties?.type ?? 'municipality'])
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

    this.map?.setFilter('parcelle-highlighted', ['==', 'id', (event as any).features?.[0]?.properties?.id ?? ''])
  }

  protected onLeave() {
    this.cursor.set('default')
    this.map?.setFilter('parcelle-highlighted', ['==', 'id', ''])
  }

  protected handleSelectParcelle(event: MapMouseEvent & { features?: MapGeoJSONFeature[] } & EventData) {
    event.originalEvent.stopPropagation()
    const feature = event["features"]?.[0];
    const { id } = this.selectedParcelle() || {};
    if (feature && id !== feature.properties["id"]) {
      this.selectedParcelle.set({...feature.properties})
    } else {
      this.selectedParcelle.set(null)
    }
  }
}
