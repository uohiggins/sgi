import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { MantenedorProyectosPage } from './mantenedor-proyectos-page';
import { SgiApiService } from '../../../../core/services/sgi-api.service';
import { PhaseFileAccess } from '../../../../core/services/phase-file-access';
import { ProjectListItem, SgiPaginatedResponse } from '../../models/project.interface';

describe('MantenedorProyectosPage', () => {
  let component: MantenedorProyectosPage;
  let fixture: ComponentFixture<MantenedorProyectosPage>;
  let sgiApiServiceSpy: { [K in keyof SgiApiService]?: any };

  const mockProjects: ProjectListItem[] = [
    {
      id: 1,
      internal_code: 'INFRA-001',
      name: 'Remodelación Auditorio',
      description: 'Mejoras acústicas',
      department_id: 10,
      department: 'Infraestructura Central',
      requesting_unit_id: 20,
      requesting_unit: 'Rectoría',
      status_id: 1,
      status: 'En progreso',
      status_color: '#3B82F6',
      is_default: false,
      created_at: '2026-10-01T10:00:00Z',
      updated_at: '2026-10-10T12:00:00Z',
      actions: {
        can_advance: true,
        can_retreat: false,
      },
    },
  ];

  const mockResponse: SgiPaginatedResponse<ProjectListItem> = {
    success: true,
    data: {
      items: mockProjects,
      pagination: {
        total: 1,
        per_page: 15,
        current_page: 1,
        last_page: 1,
      },
    },
  };

  beforeEach(() => {
    sgiApiServiceSpy = {
      getProjects: vi.fn().mockReturnValue(of(mockResponse)),
      getProjectHistory: vi.fn().mockReturnValue(of({ success: true, data: [] })),
      getProjectDocuments: vi.fn().mockReturnValue(of({ success: true, data: [] })),
    };

    TestBed.configureTestingModule({
      imports: [MantenedorProyectosPage],
      providers: [
        provideRouter([]),
        { provide: SgiApiService, useValue: sgiApiServiceSpy },
      ],
    });

    fixture = TestBed.createComponent(MantenedorProyectosPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('el modal de documentos ofrece Ver/Descargar y muestra el error del acceso al archivo', async () => {
    sgiApiServiceSpy['getProjectDocuments'].mockReturnValue(
      of({
        success: true,
        data: [
          {
            phase_id: 1,
            phase_name: 'Borrador',
            stage_name: 'Diseño',
            closed_at: null,
            files: [
              { id: 1, name: 'plano.pdf', mime_type: 'application/pdf' },
              { id: 2, name: 'logo.svg', mime_type: 'image/svg+xml' },
            ],
          },
        ],
      }),
    );
    component.openDocumentsModal(mockProjects[0]);
    fixture.detectChanges();
    const root = document.body;

    expect(root.querySelectorAll('[data-testid="file-view"]').length).toBe(1);
    expect(root.querySelectorAll('[data-testid="file-download"]').length).toBe(2);

    const access = TestBed.inject(PhaseFileAccess);
    vi.spyOn(access, 'view').mockResolvedValue('No tiene permiso para acceder a este archivo.');
    await component.viewFile({ id: 1, name: 'plano.pdf' } as never);
    fixture.detectChanges();

    expect(root.querySelector('[data-testid="documents-file-error"]')?.textContent).toContain('No tiene permiso');
  });

  it('muestra el enlace al flujo aunque can_advance sea falso', () => {
    const link = (): HTMLAnchorElement | null =>
      (fixture.nativeElement as HTMLElement).querySelector('a[href="/proyecto/1/flujo"]');
    expect(link()).not.toBeNull();

    component.projects.set([{ ...mockProjects[0], actions: { can_advance: false } }]);
    fixture.detectChanges();
    expect(link()).not.toBeNull();
  });

  it('debe crearse e inicializar la carga de proyectos', () => {
    expect(component).toBeTruthy();
    expect(sgiApiServiceSpy.getProjects).toHaveBeenCalledWith({
      page: 1,
      per_page: 15,
      search: undefined,
    });
    expect(component.projects().length).toBe(1);
    expect(component.projects()[0].name).toBe('Remodelación Auditorio');
  });

  it('goToPage debe solicitar la página indicada si es válida', () => {
    component.pagination.set({
      total: 30,
      per_page: 15,
      current_page: 1,
      last_page: 2,
    });

    component.goToPage(2);
    expect(component.currentPage()).toBe(2);
    expect(sgiApiServiceSpy.getProjects).toHaveBeenCalledWith({
      page: 2,
      per_page: 15,
      search: undefined,
    });
  });

  it('onSearch debe actualizar searchTerm, reiniciar a página 1 y recargar', () => {
    component.onSearch('Auditorio');
    expect(component.searchTerm()).toBe('Auditorio');
    expect(component.currentPage()).toBe(1);
    expect(sgiApiServiceSpy.getProjects).toHaveBeenCalledWith({
      page: 1,
      per_page: 15,
      search: 'Auditorio',
    });
  });

  it('openHistoryModal debe abrir UohModal de historial y llamar a getProjectHistory', () => {
    const project = mockProjects[0];
    const openSpy = vi.spyOn(component.historyModal()!, 'open');

    component.openHistoryModal(project);

    expect(openSpy).toHaveBeenCalled();
    expect(component.activeModal()).toBe('history');
    expect(component.selectedProject()).toBe(project);
    expect(sgiApiServiceSpy.getProjectHistory).toHaveBeenCalledWith(project.id);
  });

  it('openDocumentsModal debe abrir UohModal de documentos y llamar a getProjectDocuments', () => {
    const project = mockProjects[0];
    const openSpy = vi.spyOn(component.documentsModal()!, 'open');

    component.openDocumentsModal(project);

    expect(openSpy).toHaveBeenCalled();
    expect(component.activeModal()).toBe('documents');
    expect(component.selectedProject()).toBe(project);
    expect(sgiApiServiceSpy.getProjectDocuments).toHaveBeenCalledWith(project.id);
  });

  it('closeModal debe cerrar el UohModal activo y resetear el estado del modal', () => {
    const closeSpy = vi.spyOn(component.historyModal()!, 'close');

    component.openHistoryModal(mockProjects[0]);
    component.closeModal();

    expect(closeSpy).toHaveBeenCalled();
    expect(component.activeModal()).toBeNull();
    expect(component.selectedProject()).toBeNull();
    expect(component.historyItems()).toEqual([]);
  });

  it('onModalHidden debe sincronizar activeModal cuando Bootstrap cierra el modal (ESC o backdrop) y permitir reabrir', () => {
    const project = mockProjects[0];
    const openSpy = vi.spyOn(component.documentsModal()!, 'open');

    component.openDocumentsModal(project);
    expect(component.activeModal()).toBe('documents');

    component.onModalHidden('documents');
    expect(component.activeModal()).toBeNull();
    expect(component.selectedProject()).toBeNull();

    component.openDocumentsModal(project);
    expect(openSpy).toHaveBeenCalledTimes(2);
    expect(component.activeModal()).toBe('documents');
  });

  it('getTextColor debe calcular contraste oscuro para colores claros y claro para oscuros', () => {
    expect(component.getTextColor('#FFFFFF')).toBe('#1f2937');
    expect(component.getTextColor('#000000')).toBe('#ffffff');
    expect(component.getTextColor('#F59E0B')).toBe('#1f2937'); // Ámbar/amarillo
    expect(component.getTextColor('#1E3A8A')).toBe('#ffffff'); // Azul oscuro
  });
});
