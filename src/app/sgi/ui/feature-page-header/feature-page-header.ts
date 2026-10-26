import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'sgi-feature-page-header',
  standalone: true,
  templateUrl: './feature-page-header.html',
  styleUrl: './feature-page-header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeaturePageHeader {
  readonly title = input.required<string>();
  readonly description = input<string>('');
  readonly eyebrow = input<string>('SGI');
}