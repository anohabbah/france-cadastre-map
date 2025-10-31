import {Component} from '@angular/core';
import {NgxMapLibreGLModule} from '@maplibre/ngx-maplibre-gl';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatAutocompleteModule} from '@angular/material/autocomplete';
import {MatInputModule} from '@angular/material/input';
import {ReactiveFormsModule} from '@angular/forms';
import {RouterLink, RouterLinkActive, RouterOutlet} from '@angular/router';
import {MatIcon} from '@angular/material/icon';
import {MatButton, MatIconButton} from '@angular/material/button';
import {MatSidenavContainer, MatSidenavContent} from '@angular/material/sidenav';
import {MatToolbar} from '@angular/material/toolbar';

@Component({
  selector: 'cdst-root',
  imports: [
    NgxMapLibreGLModule,
    MatFormFieldModule,
    MatAutocompleteModule,
    MatInputModule,
    ReactiveFormsModule,
    RouterOutlet,
    MatIcon,
    MatSidenavContainer,
    MatSidenavContent,
    MatToolbar,
    RouterLink,
    MatButton,
    RouterLinkActive,
    MatIconButton,
  ],
  templateUrl: './app.html',
  styles: `
    .active {
    }
  `,
  host: {
    class: 'w-full h-full block relative'
  },
})
export class App {
}
