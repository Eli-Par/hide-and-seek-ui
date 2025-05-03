import { Component, OnInit } from '@angular/core';
import * as L from 'leaflet';
import { stops } from '../stop-data';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-map-view',
  standalone: true,
  templateUrl: './map-view.component.html',
  styleUrls: ['./map-view.component.scss'],
  imports: [FormsModule, CommonModule],
})
export class MapViewComponent implements OnInit {
  private map: L.Map | undefined;
  private markers: L.Marker[] = [];
  private circles: L.Circle[] = [];

  zoneRadius = 500;
  searchQuery = "";
  showDisabled = true;
  showDisabledLegend = true;

  enabledStops: Set<string> = new Set();
  public stops = stops;

  filteredStops() {
    const query = this.searchQuery.toLowerCase();
    return this.stops.filter(stop =>
      stop.stop_name.toLowerCase().includes(query) && (this.showDisabledLegend || this.enabledStops.has(stop.stop_id))
    );
  }

  ngOnInit(): void {
    this.loadZoneRadius();
    this.loadEnabledStops();
    this.initMap();
    this.plotStops();
  }

  private initMap(): void {
    this.map = L.map('map').setView([42.31777149063969, -83.04336801890909], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.map);

    this.setupMapRightClick();
  }


  private loadZoneRadius(): void {
    const savedZoneRadius = localStorage.getItem('zoneRadius');
    if (savedZoneRadius) {
      this.zoneRadius = parseInt(savedZoneRadius, 10);
    }
  }

  private saveZoneRadius(): void {
    localStorage.setItem('zoneRadius', this.zoneRadius.toString());
  }

  zoneRadiusChanged() {
    this.saveZoneRadius();
    this.resetPlot();
  }

  private setupMapRightClick(): void {
    this.map?.on('contextmenu', (e: L.LeafletMouseEvent) => {
      const lat = e.latlng.lat;
      const lon = e.latlng.lng;

      let closestStop = null;
      let minDistance = 200;

      for (const stop of this.stops) {
        const distance = this.getDistance(stop.stop_lat, stop.stop_lon, lat, lon);
        if (distance < minDistance) {
          minDistance = distance;
          closestStop = stop;
        }
      }

      if (closestStop) {
        this.toggleStop(closestStop.stop_id);
      }
    });
  }

  toggleAllStopsOff(): void {
    // Create a new set with all stop IDs
    this.enabledStops = new Set();

    // Persist to local storage
    this.saveEnabledStops();

    // Redraw the map with all circles removed
    this.resetPlot();
  }

  resetPlot(): void {
    this.removePlottedStops();
    this.plotStops();
  }

  private removePlottedStops(): void {
    if (!this.map) return;

    this.markers.forEach(marker => this.map!.removeLayer(marker));
    this.circles.forEach(circle => this.map!.removeLayer(circle));

    this.markers = [];
    this.circles = [];
  }

  private plotStops(): void {
    if (!this.map) return;

    for (const stop of this.stops) {
      const lat = stop.stop_lat;
      const lon = stop.stop_lon;

      const isEnabled = this.enabledStops.has(stop.stop_id);

      // Plot marker
      if(isEnabled || this.showDisabled) {
        const marker = L.marker([lat, lon], {
          icon: L.divIcon({
            className: 'leaflet-div-icon',
            html: `<div style="background-color: ${(isEnabled ? 'green' : 'red')}; width: 6px; height: 6px;"></div>`,
            iconSize: [6, 6],
            iconAnchor: [3, 3],
          }),
        }).addTo(this.map!);
        marker.bindPopup(stop.stop_name);
        this.markers.push(marker);
      }

      if (isEnabled) {
        const circle = L.circle([lat, lon], {
          radius: this.zoneRadius,
          color: 'blue',
          fillOpacity: 0.2,
        }).addTo(this.map!);
        this.circles.push(circle);
      }
    }
  }

  toggleStop(stopId: string): void {
    if (this.enabledStops.has(stopId)) {
      this.enabledStops.delete(stopId);
    } else {
      this.enabledStops.add(stopId);
    }
    this.saveEnabledStops();
    this.resetPlot();
  }

  private loadEnabledStops(): void {
    const saved = localStorage.getItem('enabledStops');
    if (saved) {
      this.enabledStops = new Set(JSON.parse(saved));
    }
  }

  private saveEnabledStops(): void {
    localStorage.setItem('enabledStops', JSON.stringify([...this.enabledStops]));
  }

  private getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) ** 2 +
      Math.cos(φ1) * Math.cos(φ2) *
      Math.sin(Δλ / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  exportEnabledStops(): void {
    const data = [...this.enabledStops].join('\n');
    const blob = new Blob([data], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'stop_list.txt';
    a.click();

    URL.revokeObjectURL(url);
  }

  importEnabledStops(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    const reader = new FileReader();

    reader.onload = () => {
      const content = reader.result as string;
      const ids = content.split('\n').map(id => id.trim()).filter(id => id);
      this.enabledStops = new Set(ids);
      this.saveEnabledStops();
      this.resetPlot();

      // ✅ Reset input so the same file can be imported again
      input.value = '';
    };

    reader.readAsText(file);
  }


}
