import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { DialogModule } from 'primeng/dialog';
import { SplashScreenComponent } from './components/splash-screen.component';

@Component({
  imports: [RouterModule, DialogModule, SplashScreenComponent],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected title = 'my-angular-project';
}
