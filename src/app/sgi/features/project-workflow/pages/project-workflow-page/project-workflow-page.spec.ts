import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../../../../auth/services/auth-service';
import { PhaseFileAccess } from '../../../../core/services/phase-file-access';
import { SgiApiService } from '../../../../core/services/sgi-api.service';
import { Phase, ProjectPhaseFile } from '../../../mantenedor-proyectos/models/project.interface';
import { buildProject } from '../../testing/project-fixture';
import { ProjectWorkflowPage } from './project-workflow-page';

describe('ProjectWorkflowPage', () => {
  let fixture: ComponentFixture<ProjectWorkflowPage>;
  const getProject = vi.fn();
  const getPhase = vi.fn();
  const uploadPhaseFile = vi.fn();
  const deleteFile = vi.fn();
  let canManage = true;

  const file = (id: number, extra: Partial<ProjectPhaseFile> = {}): ProjectPhaseFile => ({
    id,
    requirement_id: 1,
    requirement_name: 'Planos',
    milestone_id: null,
    uploaded_by: 'Ana Pérez',
    name: `archivo-${id}.pdf`,
    file_path: `sgi/archivo-${id}.pdf`,
    file_size: 2048,
    mime_type: 'application/pdf',
    was_uploaded_after_close: false,
    created_at: '2026-10-05T12:30:00Z',
    ...extra,
  });

  const text = (testId: string): string =>
    (fixture.nativeElement as HTMLElement).querySelector(`[data-testid="${testId}"]`)?.textContent?.replace(/\s+/g, ' ').trim() ?? '';

  async function render(): Promise<void> {
    getProject.mockReturnValue(of({ success: true, data: buildProject() }));
    getPhase.mockImplementation((id: number) =>
      of({
        success: true,
        data: {
          id,
          files: id === 12 ? [file(1)] : [file(9, { was_uploaded_after_close: true, requirement_id: 6 })],
        } as Phase,
      }),
    );
    TestBed.configureTestingModule({
      imports: [ProjectWorkflowPage],
      providers: [
        provideRouter([]),
        { provide: SgiApiService, useValue: { getProject, getPhase, uploadPhaseFile, deleteFile } },
        { provide: AuthService, useValue: { hasPermission: () => canManage } },
      ],
    });
    fixture = TestBed.createComponent(ProjectWorkflowPage);
    fixture.componentRef.setInput('projectId', '7');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  beforeEach(() => {
    canManage = true;
    getProject.mockReset();
    getPhase.mockReset();
    uploadPhaseFile.mockReset();
    deleteFile.mockReset();
  });

  it('el selector de etapas deshabilita las futuras y cambia de etapa', async () => {
    await render();

    const pills = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('uoh-stepper .uoh-stepper__item'),
    ) as HTMLElement[];
    expect(pills.map((p) => p.textContent?.trim())).toEqual(['Diseño', 'Ejecución']);
    expect(pills[0].querySelector('.is-disabled')).toBeNull();
    expect(pills[1].querySelector('.is-disabled')).not.toBeNull();
    expect(pills[0].classList).toContain('is-active');
  });

  it('lista los archivos del requisito y el panel de documentos con autor, fecha y tamaño', async () => {
    await render();

    expect(getPhase).toHaveBeenCalledWith(12);
    expect(text('req-files-1')).toContain('archivo-1.pdf');
    expect(text('flow-docs')).toContain('Planos');
    expect(text('flow-docs')).toContain('Ana Pérez');
    expect(text('flow-docs')).toContain('05/10/2026');
    expect(text('flow-docs')).toContain('2.0 KB');
    expect(fixture.nativeElement.querySelector('[data-testid="flow-after-close"]')).toBeNull();
  });

  it('marca los subidos después del cierre solo en fase cerrada', async () => {
    await render();

    (fixture.nativeElement.querySelectorAll('.step-item')[0] as HTMLElement).click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(getPhase).toHaveBeenCalledWith(11);
    expect(text('flow-after-close')).toBe('Subido después del cierre');
  });

  it('sin permiso de gestión oculta adjuntar y eliminar pero deja ver los archivos', async () => {
    canManage = false;
    await render();

    expect(fixture.nativeElement.querySelector('[data-testid="flow-upload"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('[data-testid="req-files-1"] uoh-button[arialabel="Eliminar archivo"]')).toBeNull();
    expect(text('req-files-1')).toContain('archivo-1.pdf');
  });

  it('el panel distingue cargando, error de carga y vacío', async () => {
    await render();
    const state = fixture.componentInstance.state;

    state.filesLoading.set(true);
    state.filesError.set(null);
    state['phaseDetail'].set(null);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-testid="flow-docs-loading"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('[data-testid="flow-docs-empty"]')).toBeNull();

    state.filesLoading.set(false);
    state.filesError.set('No se pudieron cargar los documentos de la fase.');
    fixture.detectChanges();
    expect(text('flow-docs-error')).toBe('No se pudieron cargar los documentos de la fase.');
    expect(fixture.nativeElement.querySelector('[data-testid="flow-docs-empty"]')).toBeNull();

    state.filesError.set(null);
    fixture.detectChanges();
    expect(text('flow-docs-empty')).toBe('Esta fase aún no tiene documentos.');
  });

  it('un fallo de getPhase muestra el error y no el vacío', async () => {
    await render();
    getPhase.mockReturnValue(throwError(() => new Error('boom')));

    fixture.componentInstance.state.loadPhaseDetail();
    fixture.detectChanges();

    expect(text('flow-docs-error')).toContain('No se pudieron cargar');
    expect(fixture.nativeElement.querySelector('[data-testid="flow-docs-empty"]')).toBeNull();
  });

  it('muestra Ver solo en archivos de tipo seguro y Descargar en todos', async () => {
    await render();
    getPhase.mockReturnValue(
      of({
        success: true,
        data: {
          id: 12,
          files: [file(1), file(2, { name: 'logo.svg', mime_type: 'image/svg+xml' })],
        } as Phase,
      }),
    );
    fixture.componentInstance.state.loadPhaseDetail();
    fixture.detectChanges();

    const rows = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('[data-testid="flow-docs"] > li'),
    );
    expect(rows[0].querySelector('[data-testid="file-view"]')).not.toBeNull();
    expect(rows[0].querySelector('[data-testid="file-download"]')).not.toBeNull();
    expect(rows[1].querySelector('[data-testid="file-view"]')).toBeNull();
    expect(rows[1].querySelector('[data-testid="file-download"]')).not.toBeNull();
  });

  it('un 403 o 404 al descargar muestra un mensaje claro', async () => {
    await render();
    const access = TestBed.inject(PhaseFileAccess);
    vi.spyOn(access, 'download').mockResolvedValue('El archivo ya no está disponible.');

    (fixture.nativeElement.querySelector('[data-testid="flow-docs"] [data-testid="file-download"]') as HTMLElement).click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(text('flow-action-error')).toBe('El archivo ya no está disponible.');
  });

  it('la zona de arrastre está plegada, se despliega con el botón y se pliega tras subir', async () => {
    await render();
    expect(fixture.nativeElement.querySelector('uoh-upload-draggable')).toBeNull();

    (fixture.nativeElement.querySelector('[data-testid="flow-upload-toggle"] button, [data-testid="flow-upload-toggle"]') as HTMLElement).click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('uoh-upload-draggable').length).toBe(1);

    uploadPhaseFile.mockReturnValue(of({ success: true, data: file(2) }));
    const uploader = {
      currentValue: () => ({ type: 'document' as const, file: new File(['x'], 'a.pdf') }),
      reset: vi.fn(),
    };
    fixture.componentInstance.attach(1, uploader as never);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('uoh-upload-draggable')).toBeNull();
  });

  it('adjunta con file y requirement_id, y refresca el estado', async () => {
    await render();
    uploadPhaseFile.mockReturnValue(of({ success: true, data: file(2) }));
    const pending = new File(['x'], 'plano.pdf', { type: 'application/pdf' });
    const uploader = {
      currentValue: () => ({ type: 'document' as const, file: pending }),
      reset: vi.fn(),
    };

    fixture.componentInstance.attach(1, uploader as never);

    const [phaseId, body] = uploadPhaseFile.mock.calls[0] as [number, FormData];
    expect(phaseId).toBe(12);
    expect((body.get('file') as File).name).toBe('plano.pdf');
    expect(body.get('requirement_id')).toBe('1');
    expect(uploader.reset).toHaveBeenCalled();
    expect(getProject).toHaveBeenCalledTimes(2);
    expect(getPhase).toHaveBeenCalledTimes(2);
  });

  it('elimina tras confirmar y no hace nada si se cancela', async () => {
    await render();
    deleteFile.mockReturnValue(of({ success: true, data: file(1) }));
    const confirm = vi
      .spyOn(fixture.componentInstance as unknown as { confirmDelete: () => Promise<boolean> }, 'confirmDelete')
      .mockResolvedValueOnce(false);

    await fixture.componentInstance.remove(file(1));
    expect(deleteFile).not.toHaveBeenCalled();

    confirm.mockResolvedValueOnce(true);
    await fixture.componentInstance.remove(file(1));
    expect(deleteFile).toHaveBeenCalledWith(1);
    expect(getProject).toHaveBeenCalledTimes(2);
  });

  it('carga el proyecto por id y muestra encabezado, contador y checklist', async () => {
    await render();

    expect(getProject).toHaveBeenCalledWith(7);
    expect(text('flow-eyebrow')).toBe('Etapa de Diseño > Revisión');
    expect(text('flow-project')).toBe('INFRA-007 - Edificio Aulas');
    expect(text('flow-counter')).toBe('2/2');
    expect(fixture.nativeElement.querySelectorAll('[data-testid="flow-checklist"] > li').length).toBe(4);
    expect(fixture.nativeElement.querySelector('[data-testid="flow-readonly"]')).toBeNull();
  });

  it('pasa color de etapa y fases al timeline', async () => {
    await render();

    const timeline = fixture.nativeElement.querySelector('uohx-timeline') as HTMLElement;
    expect(timeline.style.getPropertyValue('--uohx-active-color')).toBe('#8a2be2');
    expect(timeline.querySelectorAll('.step-item').length).toBe(2);
    const icons = Array.from(timeline.querySelectorAll('.step-circle > i:first-child')).map(
      (i) => (i as HTMLElement).className,
    );
    expect(icons[0]).toContain('fa-pen-ruler'); // Borrador: icono propio
    expect(icons[1]).toContain('fa-file-lines'); // Revisión: fallback
  });

  it('al elegir una fase cerrada muestra solo lectura', async () => {
    await render();

    (fixture.nativeElement.querySelectorAll('.step-item')[0] as HTMLElement).click();
    fixture.detectChanges();

    expect(text('flow-eyebrow')).toBe('Etapa de Diseño > Borrador');
    expect(text('flow-counter')).toBe('1/2');
    expect(fixture.nativeElement.querySelector('[data-testid="flow-readonly"]')).not.toBeNull();
  });

  it('con layout milestones muestra el aviso de hitos en construcción', async () => {
    await render();
    const state = fixture.componentInstance.state;
    state.project.update((p) => ({
      ...p!,
      stages: p!.stages!.map((s) => ({
        ...s,
        phases: s.phases!.map((ph) => (ph.id === 12 ? { ...ph, layout: 'milestones' as const } : ph)),
      })),
    }));
    fixture.detectChanges();

    expect(text('flow-milestones')).toBe('Vista de hitos en construcción');
    expect(fixture.nativeElement.querySelector('[data-testid="flow-checklist"]')).toBeNull();
  });
});
