import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MapViewComponent } from "./map-view/map-view.component";
import { StopService } from './services/stop.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, MapViewComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'hide-and-seek-ui';

  stopLoaded = false;

  constructor(private stopService: StopService) {
    this.stopService.stops$.subscribe(res => this.stopLoaded = res.length > 0)
  }
  
  ngOnInit(): void {
      
  }

  fileUploaded(file?: File) {
    if(file) this.stopService.initialize(file);
  }
}
