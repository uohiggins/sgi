import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import Swal from 'sweetalert2/dist/sweetalert2.esm.all.js';
import { UohButton, UohStepper, UohUploadDraggable } from 'uoh-ui';
import { AuthService } from '../../../../../auth/services/auth-service';
import {
  UohxTimeline,
  UohxTimelineStep,
} from '../../../../../shared/uoh-derived/uohx-timeline/uohx-timeline';
import { ProjectPhaseFile } from '../../../mantenedor-proyectos/models/project.interface';
import { PhaseFileActions } from '../../../../ui/phase-file-actions/phase-file-actions';
import { ProjectWorkflowState } from '../../services/project-workflow-state';

export const FILES_MANAGE_PERMISSION = 'sgi.phases.files.manage';
export const MAX_FILE_SIZE_MB = 20;

@Component({
  selector: 'sgi-project-workflow-page',
  standalone: true,
  imports: [DatePipe, PhaseFileActions, UohButton, UohStepper, UohUploadDraggable, UohxTimeline],
  providers: [ProjectWorkflowState],
  templateUrl: './project-workflow-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectWorkflowPage {
  readonly state = inject(ProjectWorkflowState);
  private readonly auth = inject(AuthService);

  readonly maxFileSizeMb = MAX_FILE_SIZE_MB;

  // Parámetro de ruta (withComponentInputBinding)
  readonly projectId = input.required<string>();

  /** El backend no expone este permiso en `actions`; se consulta en AuthService. */
  readonly canManageFiles = computed(() => this.auth.hasPermission(FILES_MANAGE_PERMISSION));

  private readonly viewedPhaseId = computed(() => this.state.viewed()?.phase.id ?? null);

  constructor() {
    effect(() => {
      const id = Number(this.projectId());
      if (Number.isFinite(id)) untracked(() => this.state.load(id));
    });

    effect(() => {
      this.viewedPhaseId();
      untracked(() => this.state.loadPhaseDetail());
    });
  }

  readonly steps = computed<UohxTimelineStep[]>(() =>
    this.state
      .viewedStagePhases()
      .map((phase) => ({ label: phase.name, icon: this.state.phaseIcon(phase) })),
  );

  /** Requisito con la zona de arrastre desplegada; UohUploadDraggable no tiene modo compacto. */
  readonly uploadOpenFor = signal<number | null>(null);

  toggleUpload(requirementId: number): void {
    this.uploadOpenFor.update((open) => (open === requirementId ? null : requirementId));
  }

  attach(requirementId: number, uploader: UohUploadDraggable): void {
    const value = uploader.currentValue();
    if (!value) return;
    this.state.upload(requirementId, value, () => {
      uploader.reset();
      this.uploadOpenFor.set(null);
    });
  }

  async remove(file: ProjectPhaseFile): Promise<void> {
    if (await this.confirmDelete(file)) this.state.deleteFile(file.id);
  }

  uploaderName(file: ProjectPhaseFile): string {
    if (typeof file.uploaded_by === 'string') return file.uploaded_by;
    return file.uploaded_by_user?.name ?? '—';
  }

  formatSize(bytes: number | null): string {
    if (bytes === null || bytes === undefined) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  protected async confirmDelete(file: ProjectPhaseFile): Promise<boolean> {
    const result = await Swal.fire({
      title: 'Eliminar archivo',
      text: `¿Eliminar "${file.name}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
    });
    return result.isConfirmed;
  }
}
