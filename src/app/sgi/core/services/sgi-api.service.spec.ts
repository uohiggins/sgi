import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import { SgiApiService } from './sgi-api.service';

describe('SgiApiService', () => {
  let service: SgiApiService;
  let httpMock: HttpTestingController;
  const baseUrl = environment.API_URL;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(SgiApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('debe crearse correctamente', () => {
    expect(service).toBeTruthy();
  });

  describe('1. Sistema', () => {
    it('getHealth debe llamar a GET /sgi/health', () => {
      const mockResponse = {
        success: true,
        data: { module: 'sgi', status: 'ok', version: 'v2' },
      };

      service.getHealth().subscribe((res) => {
        expect(res).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${baseUrl}/sgi/health`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('bootstrap debe llamar a GET /sgi/bootstrap', () => {
      const mockResponse = {
        success: true,
        data: { user: null, application_id: 1, permissions: [] },
      };

      service.bootstrap().subscribe((res) => {
        expect(res).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${baseUrl}/sgi/bootstrap`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('2. Proyectos', () => {
    it('getProjects debe enviar parámetros de búsqueda y paginación', () => {
      service
        .getProjects({
          search: 'tech',
          department_id: 2,
          is_default: false,
          per_page: 25,
          page: 2,
        })
        .subscribe();

      const req = httpMock.expectOne((r) => r.url === `${baseUrl}/sgi/projects`);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('search')).toBe('tech');
      expect(req.request.params.get('department_id')).toBe('2');
      expect(req.request.params.get('is_default')).toBe('false');
      expect(req.request.params.get('per_page')).toBe('25');
      expect(req.request.params.get('page')).toBe('2');
      req.flush({ success: true, data: { items: [], pagination: { total: 0, per_page: 25, current_page: 2, last_page: 1 } } });
    });

    it('createProject debe enviar POST /sgi/projects', () => {
      const dto = { name: 'Nuevo Proyecto', from_default: true };
      service.createProject(dto).subscribe();

      const req = httpMock.expectOne(`${baseUrl}/sgi/projects`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(dto);
      req.flush({ success: true, data: { id: 10, ...dto } });
    });

    it('getProject debe llamar a GET /sgi/projects/{id}', () => {
      service.getProject(42).subscribe();
      const req = httpMock.expectOne(`${baseUrl}/sgi/projects/42`);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: { id: 42, name: 'Detalle' } });
    });

    it('updateProject debe llamar a PUT /sgi/projects/{id}', () => {
      service.updateProject(42, { name: 'Editado' }).subscribe();
      const req = httpMock.expectOne(`${baseUrl}/sgi/projects/42`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ name: 'Editado' });
      req.flush({ success: true, data: { id: 42, name: 'Editado' } });
    });

    it('cloneProject debe llamar a POST /sgi/projects/{id}/clone', () => {
      service.cloneProject(42, { name: 'Copia' }).subscribe();
      const req = httpMock.expectOne(`${baseUrl}/sgi/projects/42/clone`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ name: 'Copia' });
      req.flush({ success: true, data: { id: 43, name: 'Copia' } });
    });

    it('getProjectDocuments debe llamar a GET /sgi/projects/{id}/documents', () => {
      service.getProjectDocuments(42).subscribe();
      const req = httpMock.expectOne(`${baseUrl}/sgi/projects/42/documents`);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: [] });
    });

    it('getProjectHistory debe llamar a GET /sgi/projects/{id}/history', () => {
      service.getProjectHistory(42).subscribe();
      const req = httpMock.expectOne(`${baseUrl}/sgi/projects/42/history`);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: [] });
    });
  });

  describe('3. Workflow', () => {
    it('advanceWorkflow debe llamar a POST /sgi/projects/{id}/advance', () => {
      service.advanceWorkflow(5, { comment: 'Listo' }).subscribe();
      const req = httpMock.expectOne(`${baseUrl}/sgi/projects/5/advance`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ comment: 'Listo' });
      req.flush({ success: true, data: { is_finished: false } });
    });

    it('retreatWorkflow debe llamar a POST /sgi/projects/{id}/retreat con comentario', () => {
      service.retreatWorkflow(5, { comment: 'Falta corrección' }).subscribe();
      const req = httpMock.expectOne(`${baseUrl}/sgi/projects/5/retreat`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ comment: 'Falta corrección' });
      req.flush({ success: true, data: {} });
    });
  });

  describe('4. Etapas', () => {
    it('createStage debe llamar a POST /sgi/projects/{id}/stages', () => {
      service.createStage(1, { name: 'Diseño', color: '#ff0000' }).subscribe();
      const req = httpMock.expectOne(`${baseUrl}/sgi/projects/1/stages`);
      expect(req.request.method).toBe('POST');
      req.flush({ success: true, data: { id: 1, name: 'Diseño' } });
    });

    it('reorderStages debe llamar a POST /sgi/projects/{id}/stages/reorder', () => {
      service.reorderStages(1, { stages: [{ id: 1, sort_order: 2 }] }).subscribe();
      const req = httpMock.expectOne(`${baseUrl}/sgi/projects/1/stages/reorder`);
      expect(req.request.method).toBe('POST');
      req.flush({ success: true, data: [] });
    });

    it('updateStage debe llamar a PUT /sgi/stages/{id}', () => {
      service.updateStage(2, { name: 'Nueva etapa' }).subscribe();
      const req = httpMock.expectOne(`${baseUrl}/sgi/stages/2`);
      expect(req.request.method).toBe('PUT');
      req.flush({ success: true, data: { id: 2, name: 'Nueva etapa' } });
    });
  });

  describe('5. Fases', () => {
    it('createPhase debe llamar a POST /sgi/stages/{id}/phases', () => {
      service.createPhase(3, { name: 'Fase 1', layout: 'standard' }).subscribe();
      const req = httpMock.expectOne(`${baseUrl}/sgi/stages/3/phases`);
      expect(req.request.method).toBe('POST');
      req.flush({ success: true, data: { id: 10, name: 'Fase 1' } });
    });

    it('reorderPhases debe llamar a POST /sgi/stages/{id}/phases/reorder', () => {
      service.reorderPhases(3, { phases: [{ id: 10, sort_order: 1 }] }).subscribe();
      const req = httpMock.expectOne(`${baseUrl}/sgi/stages/3/phases/reorder`);
      expect(req.request.method).toBe('POST');
      req.flush({ success: true, data: [] });
    });

    it('getPhase debe llamar a GET /sgi/phases/{id}', () => {
      service.getPhase(10).subscribe();
      const req = httpMock.expectOne(`${baseUrl}/sgi/phases/10`);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: { id: 10, name: 'Fase' } });
    });

    it('updatePhase debe llamar a PUT /sgi/phases/{id}', () => {
      service.updatePhase(10, { name: 'Fase renombrada' }).subscribe();
      const req = httpMock.expectOne(`${baseUrl}/sgi/phases/10`);
      expect(req.request.method).toBe('PUT');
      req.flush({ success: true, data: { id: 10, name: 'Fase renombrada' } });
    });
  });

  describe('6. Requisitos', () => {
    it('createRequirement debe llamar a POST /sgi/phases/{id}/requirements', () => {
      service.createRequirement(10, { name: 'Permiso', type: 'document' }).subscribe();
      const req = httpMock.expectOne(`${baseUrl}/sgi/phases/10/requirements`);
      expect(req.request.method).toBe('POST');
      req.flush({ success: true, data: { id: 1, name: 'Permiso' } });
    });

    it('updateRequirement debe llamar a PUT /sgi/requirements/{id}', () => {
      service.updateRequirement(1, { name: 'Permiso Modificado' }).subscribe();
      const req = httpMock.expectOne(`${baseUrl}/sgi/requirements/1`);
      expect(req.request.method).toBe('PUT');
      req.flush({ success: true, data: { id: 1, name: 'Permiso Modificado' } });
    });

    it('deactivateRequirement debe llamar a DELETE /sgi/requirements/{id}', () => {
      service.deactivateRequirement(1).subscribe();
      const req = httpMock.expectOne(`${baseUrl}/sgi/requirements/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush({ success: true, data: { id: 1 } });
    });
  });

  describe('7. Archivos', () => {
    it('uploadPhaseFile debe subir FormData con file y requirement_id', () => {
      const file = new File(['dummy content'], 'test.pdf', { type: 'application/pdf' });
      service.uploadPhaseFile(10, { file, requirement_id: 4 }).subscribe();

      const req = httpMock.expectOne(`${baseUrl}/sgi/phases/10/files`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body instanceof FormData).toBe(true);
      req.flush({ success: true, data: { id: 99, name: 'test.pdf' } });
    });

    it('deleteFile debe llamar a DELETE /sgi/files/{id}', () => {
      service.deleteFile(99).subscribe();
      const req = httpMock.expectOne(`${baseUrl}/sgi/files/99`);
      expect(req.request.method).toBe('DELETE');
      req.flush({ success: true, data: { id: 99 } });
    });
  });

  describe('8. Comentarios', () => {
    it('createPhaseComment debe llamar a POST /sgi/phases/{id}/comments', () => {
      service.createPhaseComment(10, { comment: 'Comentario' }).subscribe();
      const req = httpMock.expectOne(`${baseUrl}/sgi/phases/10/comments`);
      expect(req.request.method).toBe('POST');
      req.flush({ success: true, data: { id: 5, comment: 'Comentario' } });
    });

    it('resolveComment debe llamar a POST /sgi/comments/{id}/resolve', () => {
      service.resolveComment(5).subscribe();
      const req = httpMock.expectOne(`${baseUrl}/sgi/comments/5/resolve`);
      expect(req.request.method).toBe('POST');
      req.flush({ success: true, data: { id: 5, is_resolved: true } });
    });
  });

  describe('9. Hitos', () => {
    it('getPhaseMilestones debe llamar a GET /sgi/phases/{id}/milestones', () => {
      service.getPhaseMilestones(10).subscribe();
      const req = httpMock.expectOne(`${baseUrl}/sgi/phases/10/milestones`);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: [] });
    });

    it('createMilestone debe llamar a POST /sgi/phases/{id}/milestones', () => {
      service.createMilestone(10, { name: 'Entrega de Planos' }).subscribe();
      const req = httpMock.expectOne(`${baseUrl}/sgi/phases/10/milestones`);
      expect(req.request.method).toBe('POST');
      req.flush({ success: true, data: { id: 7, name: 'Entrega de Planos' } });
    });

    it('updateMilestone debe llamar a PUT /sgi/milestones/{id}', () => {
      service.updateMilestone(7, { status: 'completed', actual_date: '2026-10-13' }).subscribe();
      const req = httpMock.expectOne(`${baseUrl}/sgi/milestones/7`);
      expect(req.request.method).toBe('PUT');
      req.flush({ success: true, data: { id: 7, status: 'completed' } });
    });

    it('deleteMilestone debe llamar a DELETE /sgi/milestones/{id}', () => {
      service.deleteMilestone(7).subscribe();
      const req = httpMock.expectOne(`${baseUrl}/sgi/milestones/7`);
      expect(req.request.method).toBe('DELETE');
      req.flush({ success: true, data: { id: 7 } });
    });
  });
});
