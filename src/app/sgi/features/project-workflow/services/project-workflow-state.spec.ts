import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { SgiApiService } from '../../../core/services/sgi-api.service';
import { Project } from '../../mantenedor-proyectos/models/project.interface';
import { buildProject } from '../testing/project-fixture';
import { ProjectWorkflowState } from './project-workflow-state';

describe('ProjectWorkflowState', () => {
  let state: ProjectWorkflowState;
  let getProject: ReturnType<typeof vi.fn>;
  const getPhase = vi.fn();
  const uploadPhaseFile = vi.fn();
  const deleteFile = vi.fn();

  function setup(project: Project | Error): void {
    getProject = vi.fn().mockReturnValue(
      project instanceof Error ? throwError(() => project) : of({ success: true, data: project }),
    );
    TestBed.configureTestingModule({
      providers: [
        ProjectWorkflowState,
        { provide: SgiApiService, useValue: { getProject, getPhase, uploadPhaseFile, deleteFile } },
      ],
    });
    state = TestBed.inject(ProjectWorkflowState);
    state.load(7);
  }

  describe('etapas y documentos', () => {
    beforeEach(() => {
      getPhase.mockReset();
      uploadPhaseFile.mockReset();
      deleteFile.mockReset();
    });

    it('stageSteps: una píldora por etapa y deshabilita las futuras sin fases alcanzadas', () => {
      setup(buildProject());

      expect(state.stageSteps()).toEqual([
        { id: '1', label: 'Diseño', color: '#8a2be2', disabled: false },
        { id: '2', label: 'Ejecución', color: '#0d6efd', disabled: true },
      ]);
      expect(state.activeStageId()).toBe('1');
    });

    it('viewStage muestra la abierta si es de la etapa, si no la última cerrada, e ignora las deshabilitadas', () => {
      const project = buildProject();
      // Todo cerrado: la fase abierta no pertenece a ninguna etapa.
      project.stages!.forEach((s) => s.phases!.forEach((p) => (p.closed_at = '2026-10-03T00:00:00Z')));
      setup(project);

      expect(state.isFinished()).toBe(true);
      state.viewStage('1');
      expect(state.viewed()?.phase.name).toBe('Revisión'); // última cerrada de Diseño
      state.viewStage('2');
      expect(state.viewed()?.phase.name).toBe('Obra');
    });

    it('viewStage con una etapa futura no cambia la vista', () => {
      setup(buildProject());

      state.viewStage('2');

      expect(state.viewed()?.phase.name).toBe('Revisión');
    });

    it('loadPhaseDetail trae los archivos de la fase vista y filesOf filtra por requisito', () => {
      getPhase.mockReturnValue(
        of({
          success: true,
          data: {
            id: 12,
            files: [
              { id: 1, requirement_id: 1 },
              { id: 2, requirement_id: 2 },
            ],
          },
        }),
      );
      setup(buildProject());

      state.loadPhaseDetail();

      expect(getPhase).toHaveBeenCalledWith(12);
      expect(state.files().length).toBe(2);
      expect(state.filesOf(1).map((f) => f.id)).toEqual([1]);
    });

    it('descarta archivos de una fase que ya no se está viendo', () => {
      getPhase.mockReturnValue(of({ success: true, data: { id: 12, files: [{ id: 1, requirement_id: 1 }] } }));
      setup(buildProject());
      state.loadPhaseDetail();

      state.viewStep(0);

      expect(state.files()).toEqual([]);
    });

    it('upload envía file y requirement_id y refresca; un 422 deja el mensaje del backend', () => {
      getPhase.mockReturnValue(of({ success: true, data: { id: 12, files: [] } }));
      setup(buildProject());
      uploadPhaseFile.mockReturnValueOnce(throwError(() => ({ error: { message: 'Archivo demasiado grande' } })));
      const value = { type: 'document' as const, file: new File(['x'], 'a.pdf') };

      state.upload(1, value);
      expect(state.actionError()).toBe('Archivo demasiado grande');
      expect(state.uploadingRequirementId()).toBeNull();

      uploadPhaseFile.mockReturnValueOnce(of({ success: true, data: {} }));
      const done = vi.fn();
      state.upload(1, value, done);

      expect(done).toHaveBeenCalled();
      expect(state.actionError()).toBeNull();
      expect(getProject).toHaveBeenCalledTimes(2);
    });

    it('deleteFile llama a la API y refresca', () => {
      getPhase.mockReturnValue(of({ success: true, data: { id: 12, files: [] } }));
      setup(buildProject());
      deleteFile.mockReturnValue(of({ success: true, data: {} }));

      state.deleteFile(5);

      expect(deleteFile).toHaveBeenCalledWith(5);
      expect(getProject).toHaveBeenCalledTimes(2);
    });
  });

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
