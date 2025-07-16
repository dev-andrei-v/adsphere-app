import {Component, Input, OnInit, signal} from '@angular/core';


import {NzCardComponent} from 'ng-zorro-antd/card';
import {NzIconDirective} from 'ng-zorro-antd/icon';
import {Locality} from '../../../../models/ad.model';
import {LeafletModule} from '@bluehalo/ngx-leaflet';
import {GoogleMap, MapMarker} from '@angular/google-maps';
import {NzButtonComponent} from 'ng-zorro-antd/button';
import {NzModalComponent, NzModalContentDirective, NzModalModule} from 'ng-zorro-antd/modal';

@Component({
  selector: 'app-ad-location-map',
  imports: [
    NzCardComponent,
    NzIconDirective,
    LeafletModule,
    GoogleMap,
    MapMarker,
    NzButtonComponent,
    NzModalComponent,
    NzModalModule,
    NzModalContentDirective
  ],
  templateUrl: './ad-location-map.component.html',
  styleUrl: './ad-location-map.component.scss'
})
export class AdLocationMapComponent implements OnInit {
  @Input() public locality!: Locality | null;

  showMapModal = signal<boolean>(false);

  center: google.maps.LatLngLiteral = { lat: 45.9, lng: 24.8 };
  zoom = 12;
  markers: google.maps.LatLngLiteral[] = [];

  mapOptions: google.maps.MapOptions = {
    mapTypeId: 'roadmap',
    zoomControl: true,
    scrollwheel: true,
    disableDoubleClickZoom: false,
    maxZoom: 18,
    minZoom: 6,
  };

  markerOptions: google.maps.MarkerOptions = {
    draggable: false,
    animation: google.maps.Animation.DROP,
  };

  ngOnInit(): void {
    if (!this.locality) {
      return;
    }

    console.log("locality", this.locality);

    this.center = {
      lat: this.locality.longitude,
      lng: this.locality.latitude
    };

    this.markers = [{
      lat: this.locality.longitude,
      lng: this.locality.latitude
    }];

    this.zoom = 12;
  }

  get modalTitle(): string {
    if (!this.locality) return 'Locație';
    return `Locația: ${this.locality.name}, ${this.locality.county}`;
  }
}
