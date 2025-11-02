import {ChangeDetectionStrategy, Component, computed, effect, inject, signal} from '@angular/core';
import {
  ControlComponent,
  EventData,
  GeolocateControlDirective,
  LayerComponent,
  MapComponent,
  NavigationControlDirective,
  PopupComponent
} from '@maplibre/ngx-maplibre-gl';
import {MAT_SNACK_BAR_DATA, MatSnackBar} from '@angular/material/snack-bar';
import vectorStyle from '../styles/vector.json';
import maplibregl, {Map, MapGeoJSONFeature, MapMouseEvent, StyleSpecification} from 'maplibre-gl';
import MaplibreGeocoder from '@maplibre/maplibre-gl-geocoder';
import {FrenchBanGeocoderApi} from '../fr-ban-geocoder.api';

@Component({
  templateUrl: './geocoder.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ControlComponent,
    GeolocateControlDirective,
    LayerComponent,
    MapComponent,
    NavigationControlDirective,
    PopupComponent
  ]
})
export class Geocoder {

  private readonly snackbar = inject(MatSnackBar);

  readonly mapStyle = vectorStyle as StyleSpecification;

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
      }), 'top-left')
    })
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

export default Geocoder;


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
