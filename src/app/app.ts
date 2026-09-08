import { Component, inject, Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterOutlet, RouterStateSnapshot, TitleStrategy } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
@Injectable()
export class App extends TitleStrategy {
  protected readonly title = inject(Title);

  updateTitle(snapshot: RouterStateSnapshot): void {
    const pageTitle = this.buildTitle(snapshot) || this.title.getTitle();
    this.title.setTitle(`SGI - ${pageTitle}`);
  }
}
