import {Component} from '@angular/core';
import {NgxMapLibreGLModule} from '@maplibre/ngx-maplibre-gl';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatAutocompleteModule} from '@angular/material/autocomplete';
import {MatInputModule} from '@angular/material/input';
import {ReactiveFormsModule} from '@angular/forms';
import {RouterOutlet} from '@angular/router';

@Component({
  selector: 'cdst-root',
  imports: [NgxMapLibreGLModule, MatFormFieldModule, MatAutocompleteModule, MatInputModule, ReactiveFormsModule, RouterOutlet],
  templateUrl: './app.html',
  host: {
    class: 'w-full h-full block relative'
  },
})
export class App {
}
