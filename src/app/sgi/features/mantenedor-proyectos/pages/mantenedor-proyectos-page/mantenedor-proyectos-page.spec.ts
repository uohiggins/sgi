import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { MantenedorProyectosPage } from './mantenedor-proyectos-page';
import { SgiApiService } from '../../../../core/services/sgi-api.service';
import { ProjectListItem, SgiPaginatedResponse } from '../../models/project.interface';

describe('MantenedorProyectosPage', () => {
  let component: MantenedorProyectosPage;
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
        { provide: SgiApiService, useValue: sgiApiServiceSpy },
      ],
    });

    const fixture = TestBed.createComponent(MantenedorProyectosPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
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

  it('openHistoryModal debe abrir el modal y llamar a getProjectHistory', () => {
    const project = mockProjects[0];
    component.openHistoryModal(project);

    expect(component.activeModal()).toBe('history');
    expect(component.selectedProject()).toBe(project);
    expect(sgiApiServiceSpy.getProjectHistory).toHaveBeenCalledWith(project.id);
  });

  it('openDocumentsModal debe abrir el modal y llamar a getProjectDocuments', () => {
    const project = mockProjects[0];
    component.openDocumentsModal(project);

    expect(component.activeModal()).toBe('documents');
    expect(component.selectedProject()).toBe(project);
    expect(sgiApiServiceSpy.getProjectDocuments).toHaveBeenCalledWith(project.id);
  });

  it('closeModal debe resetear el estado del modal', () => {
    component.openHistoryModal(mockProjects[0]);
    component.closeModal();

    expect(component.activeModal()).toBeNull();
    expect(component.selectedProject()).toBeNull();
    expect(component.historyItems()).toEqual([]);
  });

  it('getTextColor debe calcular contraste oscuro para colores claros y claro para oscuros', () => {
    expect(component.getTextColor('#FFFFFF')).toBe('#1f2937');
    expect(component.getTextColor('#000000')).toBe('#ffffff');
    expect(component.getTextColor('#F59E0B')).toBe('#1f2937'); // Ámbar/amarillo
    expect(component.getTextColor('#1E3A8A')).toBe('#ffffff'); // Azul oscuro
  });
});
