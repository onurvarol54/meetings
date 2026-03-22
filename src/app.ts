import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';

@Component({
  imports: [RouterModule, RouterOutlet],
  selector: 'app-root',
  template: '<router-outlet/>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class App {}
