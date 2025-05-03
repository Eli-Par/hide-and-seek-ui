import { Component, OnInit } from '@angular/core';
import * as L from 'leaflet';
import { stops } from '../stop-data';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-map-view',
  templateUrl: './map-view.component.html',
  styleUrl: './map-view.component.scss',
  imports: [
    FormsModule,
  ],
})
export class MapViewComponent implements OnInit {
  private map: L.Map | undefined;
  private markers: L.Marker[] = [];
  private circles: L.Circle[] = [];

  zoneRadius = 500;
  zoneOverlap = 500;

  ngOnInit(): void {
    this.initMap();
    this.plotStops();
  }

  private initMap(): void {
    this.map = L.map('map').setView([42.31777149063969, -83.04336801890909], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.map);
  }

  resetPlot() {
    this.removePlottedStops();
    this.plotStops();
  }

  private removePlottedStops(): void {
    if (!this.map) return;

    // Remove all markers
    this.markers.forEach(marker => {
      this.map?.removeLayer(marker);
    });

    // Remove all circles
    this.circles.forEach(circle => {
      this.map?.removeLayer(circle);
    });

    // Optionally, clear the arrays if you want to start fresh
    this.markers = [];
    this.circles = [];
  }


  private plotStops(): void {
    if (!this.map) return;

    // Define the keywords that should always show a circle
    const keywords = ['Terminal', 'Station', 'Hub', 'Devonshire'];

    // Function to calculate distance between two points (in meters)
    const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
      const R = 6371e3; // Earth's radius in meters
      const φ1 = lat1 * Math.PI / 180; // Latitude in radians
      const φ2 = lat2 * Math.PI / 180;
      const Δφ = (lat2 - lat1) * Math.PI / 180; // Difference in latitudes
      const Δλ = (lon2 - lon1) * Math.PI / 180; // Difference in longitudes

      const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

      return R * c; // Distance in meters
    };

    // Keep track of plotted stops (lat, lon)
    const plottedStops: Array<{ lat: number, lon: number }> = [];

    for (const stop of stops) {
      const stopLat = stop.stop_lat;
      const stopLon = stop.stop_lon;

      let shouldPlotCircle = true;

      // Check if the stop name contains any of the keywords
      if (keywords.some(keyword => stop.stop_name.includes(keyword))) {
        shouldPlotCircle = true; // Always plot a circle for these stops
      } else {
        // Check if this stop is within a certain distance (e.g., 500 meters) of an already plotted stop
        for (const plottedStop of plottedStops) {
          const distance = getDistance(plottedStop.lat, plottedStop.lon, stopLat, stopLon);
          if (distance < this.zoneOverlap) { // If within 500 meters, don't plot a circle
            shouldPlotCircle = false;
            break;
          }
        }
      }

      // Create a small dot marker
      const marker = L.marker([stopLat, stopLon], {
        icon: L.divIcon({
          className: 'leaflet-div-icon',
          html: '<div style="background-color: red; width: 6px; height: 6px; border-radius: 50%;"></div>',
          iconSize: [6, 6], // Small size for the dot
          iconAnchor: [3, 3], // Anchor the icon in the center
        }),
      }).addTo(this.map);
      marker.bindPopup(stop.stop_name);
      this.markers.push(marker);

      // Plot a circle if needed
      if (shouldPlotCircle) {
        plottedStops.push({ lat: stopLat, lon: stopLon });
        const circlePlot = L.circle([stopLat, stopLon], {
          radius: this.zoneRadius, // in meters
          color: 'blue',
          fillOpacity: 0.2
        }).addTo(this.map);
        this.circles.push(circlePlot);
      }
    }
  }


}
