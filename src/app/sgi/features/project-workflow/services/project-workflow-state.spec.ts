import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { SgiApiService } from '../../../core/services/sgi-api.service';
import { Project } from '../../mantenedor-proyectos/models/project.interface';
import { buildProject } from '../testing/project-fixture';
import { ProjectWorkflowState } from './project-workflow-state';

describe('ProjectWorkflowState', () => {
  let state: ProjectWorkflowState;
  let getProject: ReturnType<typeof vi.fn>;

  function setup(project: Project | Error): void {
    getProject = vi.fn().mockReturnValue(
      project instanceof Error ? throwError(() => project) : of({ success: true, data: project }),
    );
    TestBed.configureTestingModule({
      providers: [ProjectWorkflowState, { provide: SgiApiService, useValue: { getProject } }],
    });
    state = TestBed.inject(ProjectWorkflowState);
    state.load(7);
  }

  it('carga con getProject y ordena etapas y fases', () => {
    setup(buildProject());

    expect(getProject).toHaveBeenCalledWith(7);
    expect(state.flow().map((f) => f.phase.name)).toEqual(['Borrador', 'Revisión', 'Obra']);
  });

  it('la fase abierta es la primera sin closed_at y se ve por defecto', () => {
    setup(buildProject());

    expect(state.openPhase()?.phase.name).toBe('Revisión');
    expect(state.viewed()?.phase.name).toBe('Revisión');
    expect(state.isReadOnly()).toBe(false);
    expect(state.isFinished()).toBe(false);
  });

  it('expone timeline de la etapa vista: furthest y completedUpTo en la fase abierta', () => {
    setup(buildProject());

    expect(state.viewedStagePhases().map((p) => p.name)).toEqual(['Borrador', 'Revisión']);
    expect(state.viewedStepIndex()).toBe(1);
    expect(state.furthestStep()).toBe(1);
    expect(state.completedUpTo()).toBe(1);
  });

  it('ver una fase cerrada la deja en solo lectura y no permite ver fases posteriores a la abierta', () => {
    setup(buildProject());

    state.viewStep(0);
    expect(state.viewed()?.phase.name).toBe('Borrador');
    expect(state.isReadOnly()).toBe(true);

    state.viewPhase(21); // Obra está después de la abierta
    expect(state.viewed()?.phase.name).toBe('Borrador');
  });

  it('flechas: limitadas a la etapa vista y sin pasar de la fase abierta', () => {
    setup(buildProject());

    expect(state.canGoNext()).toBe(false);
    expect(state.canGoPrevious()).toBe(true);
    state.previous();
    expect(state.viewed()?.phase.name).toBe('Borrador');
    expect(state.canGoPrevious()).toBe(false); // no salta a otra etapa
    state.next();
    expect(state.viewed()?.phase.name).toBe('Revisión');
    expect(state.canGoNext()).toBe(false);
  });

  it('checklist: solo requisitos activos, con estado cumplido, cubierto por alternativa, pendiente y opcional', () => {
    setup(buildProject());

    const byName = Object.fromEntries(state.checklist().map((i) => [i.requirement.name, i.state]));
    expect(byName).toEqual({
      Planos: 'pending',
      'Informe A': 'covered',
      'Informe B': 'completed',
      Extra: 'optional',
    });
    expect(byName['Desactivado']).toBeUndefined();
  });

  it('usa fa-file-lines cuando la fase no trae icon (null/ausente) y respeta el icon propio', () => {
    setup(buildProject());
    const [borrador, revision] = state.flow().map((f) => f.phase);

    expect(state.phaseIcon(borrador)).toBe('fa-pen-ruler');
    expect(state.phaseIcon(revision)).toBe('fa-file-lines');
    expect(state.phaseIcon({ ...revision, icon: null })).toBe('fa-file-lines');
  });

  it('proyecto terminado: todas cerradas, se ve la última y la etapa queda completa', () => {
    const base = buildProject();
    const closed = {
      ...base,
      current_phase: null,
      stages: base.stages!.map((s) => ({
        ...s,
        phases: s.phases!.map((p) => ({ ...p, closed_at: '2026-10-03T00:00:00Z' })),
      })),
    };
    setup(closed);

    expect(state.isFinished()).toBe(true);
    expect(state.viewed()?.phase.name).toBe('Obra');
    expect(state.isReadOnly()).toBe(true);
    expect(state.completedUpTo()).toBe(state.viewedStagePhases().length);
  });

  it('al fallar la carga deja un mensaje de error', () => {
    setup(new Error('boom'));

    expect(state.project()).toBeNull();
    expect(state.error()).toBe('No se pudo cargar el proyecto.');
    expect(state.loading()).toBe(false);
  });
});
