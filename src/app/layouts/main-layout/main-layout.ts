import { ChangeDetectionStrategy, Component } from '@angular/core';
import { UohHeader } from '../../shared/components/uoh-header/uoh-header';
import { RouterOutlet } from '@angular/router';
import UohSidebar from '../../shared/components/uoh-sidebar/uoh-sidebar';

@Component({
  selector: 'main-layout',
  standalone: true,
  imports: [UohSidebar, UohHeader, RouterOutlet],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class MainLayout {}
