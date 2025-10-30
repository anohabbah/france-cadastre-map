import {
  MaplibreGeocoderApi,
  MaplibreGeocoderApiConfig,
  MaplibreGeocoderFeatureResults
} from '@maplibre/maplibre-gl-geocoder';
import {ofetch} from 'ofetch';
import {Address} from '@lib/geocode';

export const FrenchBanGeocoderApi: MaplibreGeocoderApi = {
  async forwardGeocode(config: MaplibreGeocoderApiConfig): Promise<MaplibreGeocoderFeatureResults> {
    if ((config.query || '').toString().trim().length < 3) return Promise.resolve({
      type: 'FeatureCollection',
      features: []
    });

    return ofetch(`https://data.geopf.fr/geocodage/search?q=${config.query}`)
      .then(res => {
        return ({
          ...res,
          type: 'FeatureCollection',
          features: res.features.map((feature: any) => ({
            ...feature,
            type: 'Feature',
            geometry: {...feature.geometry, type: 'Point'},
            id: feature.properties.id,
            text: feature.properties.context,
            place_name: feature.properties.label,
            place_type: [feature.properties.type],
          }))
        });
      })
  }
}
