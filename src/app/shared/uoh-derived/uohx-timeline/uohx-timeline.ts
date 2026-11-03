/**
 * Componente derivado de UohTimeline (uoh-ui).
 * Base: projects/uoh-ui/src/lib/components/uoh-timeline/ de uoh-angular-ui, commit de main 56c0600.
 * Cambios: input `color` (paso activo, completados y líneas) e input `completedUpTo`
 * (pasos con índice menor se muestran siempre como completados).
 * Solicitud: docs/solicitudes-uoh-ui/uohx-timeline.md
 */
import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { Router } from '@angular/router';

export interface UohxTimelineStep {
  label: string;
  icon: string;
  route?: string | readonly unknown[];
}

@Component({
  selector: 'uohx-timeline',
  standalone: true,
  imports: [],
  templateUrl: './uohx-timeline.html',
  styleUrl: './uohx-timeline.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[style.--uohx-active-color]': 'color()',
    '[style.--uohx-completed-color]': 'color()',
  },
})
export class UohxTimeline {
  private readonly router = inject(Router, { optional: true });

  readonly steps = input<readonly UohxTimelineStep[]>([]);
  readonly currentStep = input<number>(0); // paso que estoy viendo
  readonly furthestStep = input<number>(0); // paso máximo alcanzado
  readonly activityId = input<string | number | null>(null);
  readonly baseRoute = input<string | readonly unknown[]>('actividades');
  /** Color CSS del paso activo, los completados y las líneas. Null mantiene los colores originales. */
  readonly color = input<string | null>(null);
  /** Los pasos con índice menor se muestran siempre como completados. Null mantiene el comportamiento original. */
  readonly completedUpTo = input<number | null>(null);

  readonly stepSelect = output<{ index: number; step: UohxTimelineStep }>();

  isClickable(index: number): boolean {
    return index <= this.furthestStep();
  }

  goToStep(index: number): void {
    const step = this.steps()[index];
    if (!step || !this.isClickable(index)) return;

    this.stepSelect.emit({ index, step });

    if (!step.route || !this.router) return;

    const activityId = this.activityId();
    if (Array.isArray(step.route)) {
      this.router.navigate(step.route as unknown[]);
      return;
    }

    const routeStr = step.route as string;
    if (activityId !== null && activityId !== undefined && activityId !== '') {
      const base = this.baseRoute();
      const baseSegments = Array.isArray(base) ? base : [base];
      this.router.navigate([...baseSegments, activityId, routeStr]);
    } else if (routeStr.startsWith('/')) {
      this.router.navigateByUrl(routeStr);
    }
  }

  private isForcedCompleted(index: number): boolean {
    const upTo = this.completedUpTo();
    return upTo !== null && index < upTo;
  }

  getStepClass(index: number): string {
    const current = this.currentStep();
    const furthest = this.furthestStep();

    if (index === current) return 'active';
    if (this.isForcedCompleted(index)) return 'completed';
    if (index < current) return 'completed';
    if (index > current && index <= furthest) return 'reached';
    return 'blocked';
  }

  getLineClass(index: number): string {
    const current = this.currentStep();
    const furthest = this.furthestStep();

    // la línea i une los pasos i e i+1
    if (index < current) return 'line-completed';
    if (this.isForcedCompleted(index + 1)) return 'line-completed';

    if (index >= current && index < furthest) return 'line-reached';

    return '';
  }
}

export default UohxTimeline;
