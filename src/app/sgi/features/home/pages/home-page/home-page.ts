import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { UohUserOption, UohUserSelect, UohUserSelectValue } from 'uoh-ui';

@Component({
  selector: 'sgi-home-page',
  standalone: true,
  imports: [RouterLink, FormsModule, UohUserSelect],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage {
  readonly selectedUserId = signal<UohUserSelectValue>(null);
  readonly sampleUsers = signal<readonly UohUserOption[]>([
    {
      id: 1,
      name: 'Ana',
      last_name: 'Pérez',
      full_name: 'Ana Pérez',
      email: 'ana.perez@uoh.cl',
    },
    {
      id: 2,
      name: 'Carlos',
      last_name: 'Soto',
      full_name: 'Carlos Soto',
      email: 'carlos.soto@uoh.cl',
    },
  ]);
}