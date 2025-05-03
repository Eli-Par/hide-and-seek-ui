import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Stop } from '../stop-data';
import { Route } from '../route-data';

@Injectable({
  providedIn: 'root'
})
export class StopService {

  stops$ = new BehaviorSubject<Stop[]>([]);
  routes$ = new BehaviorSubject<Route[]>([]);

  constructor() { }

  initialize(file: File): void {
    const reader = new FileReader();

    reader.onload = () => {
      try {
        const result = reader.result as string;
        const data = JSON.parse(result);

        // Validate stops array
        if (!data.stops || !Array.isArray(data.stops)) {
          throw new Error("Invalid stops data format: 'stops' is missing or not an array.");
        }

        // Validate each stop object
        data.stops.forEach((item: any, index: any) => {
          if (!item.stop_id || !item.stop_name) {
            throw new Error(`Invalid stop format at index ${index}: missing 'stop_id' or 'stop_name'.`);
          }
        });

        // Validate routes array
        if (!data.routes || !Array.isArray(data.routes)) {
          throw new Error("Invalid routes data format: 'routes' is missing or not an array.");
        }

        // Validate each route object
        data.routes.forEach((item: any, index: any) => {
          if (!item.route_id || !item.trip_headsign) {
            throw new Error(`Invalid route format at index ${index}: missing 'route_id' or 'trip_headsign'.`);
          }
          // Optionally, you can add more specific checks for shape, color, etc.
        });

        const seenHeadsigns = new Set<string>();
        const newRoutes = data.routes.reduce((uniqueRoutes: Route[], route: Route) => {
          if (!seenHeadsigns.has(route.trip_headsign)) {
            seenHeadsigns.add(route.trip_headsign);
            uniqueRoutes.push(route);
          }
          return uniqueRoutes;
        }, []);

        // If all checks pass, update the BehaviorSubjects
        this.stops$.next(data.stops);
        this.routes$.next(newRoutes);

      } catch (err: any) {
        console.error("Error parsing data file:", err.message);
        // Optionally, you can also log the data or use console.trace() to get the call stack.
        console.trace();
      }
    };

    reader.onerror = () => {
      console.error("Failed to read file");
    };

    reader.readAsText(file);
  }


  getStops() {
    return this.stops$.getValue();
  }

  getRoutes() {
    return this.routes$.getValue();
  }
}
