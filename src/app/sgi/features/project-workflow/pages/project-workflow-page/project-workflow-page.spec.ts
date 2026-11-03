import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { SgiApiService } from '../../../../core/services/sgi-api.service';
import { buildProject } from '../../testing/project-fixture';
import { ProjectWorkflowPage } from './project-workflow-page';

describe('ProjectWorkflowPage', () => {
  let fixture: ComponentFixture<ProjectWorkflowPage>;
  const getProject = vi.fn();

  const text = (testId: string): string =>
    (fixture.nativeElement as HTMLElement).querySelector(`[data-testid="${testId}"]`)?.textContent?.replace(/\s+/g, ' ').trim() ?? '';

  async function render(): Promise<void> {
    getProject.mockReturnValue(of({ success: true, data: buildProject() }));
    TestBed.configureTestingModule({
      imports: [ProjectWorkflowPage],
      providers: [provideRouter([]), { provide: SgiApiService, useValue: { getProject } }],
    });
    fixture = TestBed.createComponent(ProjectWorkflowPage);
    fixture.componentRef.setInput('projectId', '7');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  it('carga el proyecto por id y muestra encabezado, contador y checklist', async () => {
    await render();

    expect(getProject).toHaveBeenCalledWith(7);
    expect(text('flow-eyebrow')).toBe('Etapa de Diseño > Revisión');
    expect(text('flow-project')).toBe('INFRA-007 - Edificio Aulas');
    expect(text('flow-counter')).toBe('2/2');
    expect(fixture.nativeElement.querySelectorAll('[data-testid="flow-checklist"] li').length).toBe(4);
    expect(fixture.nativeElement.querySelector('[data-testid="flow-readonly"]')).toBeNull();
  });

  it('pasa color de etapa y fases al timeline', async () => {
    await render();

    const timeline = fixture.nativeElement.querySelector('uohx-timeline') as HTMLElement;
    expect(timeline.style.getPropertyValue('--uohx-active-color')).toBe('#8a2be2');
    expect(timeline.querySelectorAll('.step-item').length).toBe(2);
    expect(timeline.querySelector('.step-circle i.fa-file-lines')).not.toBeNull();
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
