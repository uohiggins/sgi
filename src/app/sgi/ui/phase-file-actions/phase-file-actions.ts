import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { UohButton } from 'uoh-ui';
import { PhaseFileAccess } from '../../core/services/phase-file-access';
import { ProjectPhaseFile } from '../../features/mantenedor-proyectos/models/project.interface';

/** Botones Ver (solo tipos seguros) y Descargar de un archivo de fase; la acciÃ³n la ejecuta quien lo usa. */
@Component({
  selector: 'sgi-phase-file-actions',
  standalone: true,
  imports: [UohButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="d-inline-flex gap-1">
      @if (viewable()) {
        <uoh-button
          icon="fa-eye"
          size="sm"
          [iconOnly]="true"
          variant="secondary"
          appearance="outline"
          ariaLabel="Ver archivo"
          data-testid="file-view"
          (click)="view.emit(file())"
        />
      }
      <uoh-button
        icon="fa-download"
        size="sm"
        [iconOnly]="true"
        variant="secondary"
        appearance="outline"
        ariaLabel="Descargar archivo"
        data-testid="file-download"
        (click)="download.emit(file())"
      />
    </span>
  `,
})
export class PhaseFileActions {
  private readonly access = inject(PhaseFileAccess);

  readonly file = input.required<ProjectPhaseFile>();
  readonly view = output<ProjectPhaseFile>();
  readonly download = output<ProjectPhaseFile>();

  protected readonly viewable = computed(() => this.access.canView(this.file()));
}
