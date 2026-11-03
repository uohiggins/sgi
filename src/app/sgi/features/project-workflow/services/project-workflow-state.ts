import { computed, inject, Injectable, signal } from '@angular/core';
import { SgiApiService } from '../../../core/services/sgi-api.service';
import {
  Phase,
  PhaseRequirement,
  Project,
  Stage,
} from '../../mantenedor-proyectos/models/project.interface';

export const DEFAULT_PHASE_ICON = 'fa-file-lines';

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

  load(projectId: number): void {
    this.loading.set(true);
    this.error.set(null);
    this.viewedPhaseId.set(null);

    this.api.getProject(projectId).subscribe({
      next: (response) => {
        this.project.set(response.data);
        this.loading.set(false);
      },
      error: () => {
        this.project.set(null);
        this.error.set('No se pudo cargar el proyecto.');
        this.loading.set(false);
      },
    });
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
