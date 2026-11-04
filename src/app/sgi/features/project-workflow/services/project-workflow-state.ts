import { computed, inject, Injectable, signal } from '@angular/core';
import { buildUohUploadFormData, UohUploadValue } from 'uoh-ui';
import { SgiApiService } from '../../../core/services/sgi-api.service';
import {
  Phase,
  PhaseRequirement,
  Project,
  ProjectPhaseFile,
  Stage,
} from '../../mantenedor-proyectos/models/project.interface';

export const DEFAULT_PHASE_ICON = 'fa-file-lines';

export interface StageStep {
  id: string;
  label: string;
  color?: string;
  disabled: boolean;
}

export interface FlowPhase {
  phase: Phase;
  stage: Stage;
}

export type RequirementState = 'completed' | 'covered' | 'pending' | 'optional';

export interface ChecklistItem {
  requirement: PhaseRequirement;
  state: RequirementState;
}

/**
 * Estado del flujo de un proyecto. Se provee a nivel de componente (una instancia por página).
 * La fase abierta es la primera sin `closed_at` en orden por etapa y por fase.
 */
@Injectable()
export class ProjectWorkflowState {
  private readonly api = inject(SgiApiService);

  readonly project = signal<Project | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  private readonly viewedPhaseId = signal<number | null>(null);
  private readonly phaseDetail = signal<Phase | null>(null);
  private projectId = 0;

  readonly stages = computed<Stage[]>(() =>
    [...(this.project()?.stages ?? [])]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((stage) => ({
        ...stage,
        phases: [...(stage.phases ?? [])].sort((a, b) => a.sort_order - b.sort_order),
      })),
  );

  /** Todas las fases en orden lineal (por etapa y por fase). */
  readonly flow = computed<FlowPhase[]>(() =>
    this.stages().flatMap((stage) => (stage.phases ?? []).map((phase) => ({ phase, stage }))),
  );

  /** Índice lineal de la fase abierta; igual al total si todas están cerradas (proyecto terminado). */
  readonly openIndex = computed(() => {
    const flow = this.flow();
    const idx = flow.findIndex((f) => !f.phase.closed_at);
    return idx === -1 ? flow.length : idx;
  });

  readonly isFinished = computed(() => this.flow().length > 0 && this.openIndex() >= this.flow().length);

  readonly openPhase = computed<FlowPhase | null>(() => this.flow()[this.openIndex()] ?? null);

  /** Índice lineal de la fase que se está viendo (nunca posterior a la abierta). */
  readonly viewedIndex = computed(() => {
    const flow = this.flow();
    if (flow.length === 0) return -1;
    const maxIndex = Math.min(this.openIndex(), flow.length - 1);
    const id = this.viewedPhaseId();
    const idx = id === null ? -1 : flow.findIndex((f) => f.phase.id === id);
    return idx === -1 ? maxIndex : Math.min(idx, maxIndex);
  });

  readonly viewed = computed<FlowPhase | null>(() => this.flow()[this.viewedIndex()] ?? null);

  readonly viewedStagePhases = computed<Phase[]>(() => this.viewed()?.stage.phases ?? []);

  /** Posición (base 0) de la fase vista dentro de su etapa. */
  readonly viewedStepIndex = computed(() => {
    const viewed = this.viewed();
    return viewed ? this.viewedStagePhases().findIndex((p) => p.id === viewed.phase.id) : -1;
  });

  /** Paso máximo alcanzado dentro de la etapa vista: la fase abierta, o toda la etapa si ya la superó. */
  readonly furthestStep = computed(() => {
    const phases = this.viewedStagePhases();
    const open = this.openPhase();
    const idx = open ? phases.findIndex((p) => p.id === open.phase.id) : -1;
    return idx === -1 ? phases.length - 1 : idx;
  });

  /** Pasos con índice menor se muestran completados: hasta la abierta, o toda la etapa si ya la superó. */
  readonly completedUpTo = computed(() => {
    const phases = this.viewedStagePhases();
    const open = this.openPhase();
    const idx = open ? phases.findIndex((p) => p.id === open.phase.id) : -1;
    return idx === -1 ? phases.length : idx;
  });

  readonly isReadOnly = computed(() => !!this.viewed()?.phase.closed_at);

  readonly canGoPrevious = computed(() => this.viewedStepIndex() > 0);
  readonly canGoNext = computed(() => {
    const idx = this.viewedStepIndex();
    return idx >= 0 && idx < this.furthestStep();
  });

  readonly checklist = computed<ChecklistItem[]>(() => {
    const phase = this.viewed()?.phase;
    const active = [...(phase?.requirements ?? [])]
      .filter((r) => r.is_active !== false && !r.deactivated_at)
      .sort((a, b) => a.sort_order - b.sort_order);

    // Un grupo queda cubierto cuando cualquiera de sus requisitos está cumplido.
    const fulfilledGroups = new Set(
      active.filter((r) => r.group_key && r.is_completed).map((r) => r.group_key as string),
    );

    return active.map((requirement) => ({
      requirement,
      state: this.stateOf(requirement, fulfilledGroups),
    }));
  });

  /** Una píldora por etapa; las futuras sin ninguna fase abierta ni cerrada quedan deshabilitadas. */
  readonly stageSteps = computed<StageStep[]>(() => {
    const open = this.openIndex();
    let offset = 0;
    return this.stages().map((stage) => {
      const count = stage.phases?.length ?? 0;
      const reachable = count > 0 && offset <= open;
      offset += count;
      return {
        id: String(stage.id),
        label: stage.name,
        ...(stage.color ? { color: stage.color } : {}),
        disabled: !reachable,
      };
    });
  });

  readonly activeStageId = computed(() => {
    const viewed = this.viewed();
    return viewed ? String(viewed.stage.id) : '';
  });

  /** Archivos de la fase vista (GET /sgi/phases/{id}); el detalle del proyecto no los incluye. */
  readonly files = computed<ProjectPhaseFile[]>(() => {
    const detail = this.phaseDetail();
    return detail && detail.id === this.viewed()?.phase.id ? (detail.files ?? []) : [];
  });
  readonly filesLoading = signal(false);
  readonly uploadingRequirementId = signal<number | null>(null);
  readonly deletingFileId = signal<number | null>(null);
  readonly actionError = signal<string | null>(null);

  load(projectId: number): void {
    this.projectId = projectId;
    this.loading.set(true);
    this.error.set(null);
    this.viewedPhaseId.set(null);
    this.fetchProject();
  }

  /** Vuelve a pedir proyecto y archivos de la fase vista sin perder la fase que se está mirando. */
  refresh(): void {
    this.fetchProject(false);
    this.loadPhaseDetail();
  }

  /** Muestra la fase abierta de la etapa si le pertenece; si no, la última cerrada. */
  viewStage(stageId: string): void {
    const stage = this.stages().find((s) => String(s.id) === stageId);
    const phases = stage?.phases ?? [];
    const open = this.openPhase();
    const target =
      phases.find((p) => p.id === open?.phase.id) ?? [...phases].reverse().find((p) => !!p.closed_at);
    if (target) this.viewPhase(target.id);
  }

  /** Carga el detalle (archivos) de la fase vista; descarta respuestas de una fase que ya no se mira. */
  loadPhaseDetail(): void {
    const phaseId = this.viewed()?.phase.id;
    if (phaseId === undefined) {
      this.phaseDetail.set(null);
      return;
    }
    this.filesLoading.set(true);
    this.api.getPhase(phaseId).subscribe({
      next: (response) => {
        if (this.viewed()?.phase.id === phaseId) this.phaseDetail.set(response.data);
        this.filesLoading.set(false);
      },
      error: () => {
        if (this.viewed()?.phase.id === phaseId) this.phaseDetail.set(null);
        this.filesLoading.set(false);
        this.actionError.set('No se pudieron cargar los documentos de la fase.');
      },
    });
  }

  filesOf(requirementId: number): ProjectPhaseFile[] {
    return this.files().filter((f) => f.requirement_id === requirementId);
  }

  upload(requirementId: number, value: UohUploadValue, onDone?: () => void): void {
    const phaseId = this.viewed()?.phase.id;
    if (phaseId === undefined || value.type !== 'document') return;

    const body = buildUohUploadFormData(value, { document: 'file' });
    body.append('requirement_id', String(requirementId));
    this.actionError.set(null);
    this.uploadingRequirementId.set(requirementId);

    this.api.uploadPhaseFile(phaseId, body).subscribe({
      next: () => {
        this.uploadingRequirementId.set(null);
        onDone?.();
        this.refresh();
      },
      error: (err) => {
        this.uploadingRequirementId.set(null);
        this.actionError.set(this.messageOf(err, 'No se pudo adjuntar el archivo.'));
      },
    });
  }

  deleteFile(fileId: number): void {
    this.actionError.set(null);
    this.deletingFileId.set(fileId);

    this.api.deleteFile(fileId).subscribe({
      next: () => {
        this.deletingFileId.set(null);
        this.refresh();
      },
      error: (err) => {
        this.deletingFileId.set(null);
        this.actionError.set(this.messageOf(err, 'No se pudo eliminar el archivo.'));
      },
    });
  }

  private fetchProject(resetOnError = true): void {
    this.api.getProject(this.projectId).subscribe({
      next: (response) => {
        this.project.set(response.data);
        this.loading.set(false);
      },
      error: () => {
        if (resetOnError) {
          this.project.set(null);
          this.error.set('No se pudo cargar el proyecto.');
        } else {
          this.actionError.set('No se pudo actualizar el estado del proyecto.');
        }
        this.loading.set(false);
      },
    });
  }

  private messageOf(err: unknown, fallback: string): string {
    const message = (err as { error?: { message?: unknown } } | null)?.error?.message;
    return typeof message === 'string' && message ? message : fallback;
  }

  /** Muestra la fase de la etapa vista en la posición dada; ignora fases posteriores a la abierta. */
  viewStep(stepIndex: number): void {
    const target = this.viewedStagePhases()[stepIndex];
    if (target) this.viewPhase(target.id);
  }

  viewPhase(phaseId: number): void {
    const idx = this.flow().findIndex((f) => f.phase.id === phaseId);
    if (idx === -1 || idx > this.openIndex()) return;
    this.viewedPhaseId.set(phaseId);
  }

  previous(): void {
    if (this.canGoPrevious()) this.viewStep(this.viewedStepIndex() - 1);
  }

  next(): void {
    if (this.canGoNext()) this.viewStep(this.viewedStepIndex() + 1);
  }

  phaseIcon(phase: Phase): string {
    return phase.icon ?? DEFAULT_PHASE_ICON;
  }

  private stateOf(requirement: PhaseRequirement, fulfilledGroups: Set<string>): RequirementState {
    if (requirement.is_completed) return 'completed';
    if (requirement.group_key && fulfilledGroups.has(requirement.group_key)) return 'covered';
    return requirement.is_required ? 'pending' : 'optional';
  }
}
