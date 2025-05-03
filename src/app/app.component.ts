import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MapViewComponent } from "./map-view/map-view.component";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, MapViewComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'hide-and-seek-ui';
}
