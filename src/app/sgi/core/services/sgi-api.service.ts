import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  AdvanceWorkflowDto,
  CloneProjectDto,
  CreateMilestoneDto,
  CreatePhaseCommentDto,
  CreatePhaseDto,
  CreateProjectDto,
  CreateRequirementDto,
  CreateStageDto,
  Phase,
  PhaseRequirement,
  Project,
  ProjectFilterParams,
  ProjectHistoryItem,
  ProjectListItem,
  ProjectMilestone,
  ProjectPhaseDocumentGroup,
  ProjectPhaseComment,
  ProjectPhaseFile,
  ReorderPhasesDto,
  ReorderStagesDto,
  RetreatWorkflowDto,
  SgiApiResponse,
  SgiBootstrapPayload,
  SgiHealthPayload,
  SgiPaginatedResponse,
  Stage,
  UpdateMilestoneDto,
  UpdatePhaseDto,
  UpdateProjectDto,
  UpdateRequirementDto,
  UpdateStageDto,
  UploadPhaseFileDto,
  UserProfileData,
  WorkflowAdvanceResponse,
  WorkflowRetreatResponse,
} from '../../features/mantenedor-proyectos/models/project.interface';

// Re-exportamos los tipos esenciales para consumidores de core
export type {
  SgiApiResponse,
  SgiPaginatedResponse,
  SgiHealthPayload,
  SgiBootstrapPayload,
  UserProfileData,
};

@Injectable({
  providedIn: 'root',
})
export class SgiApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.API_URL;

  // ==========================================
  // 1. Sistema / Salud y Bootstrap
  // ==========================================

  /**
   * Endpoint de salud del módulo SGI.
   * GET /sgi/health
   */
  getHealth(): Observable<SgiApiResponse<SgiHealthPayload>> {
    return this.http.get<SgiApiResponse<SgiHealthPayload>>(`${this.apiUrl}/sgi/health`);
  }

  /**
   * Bootstrap de sesión y permisos específicos de SGI.
   * GET /sgi/bootstrap
   */
  bootstrap(): Observable<SgiApiResponse<SgiBootstrapPayload>> {
    return this.http.get<SgiApiResponse<SgiBootstrapPayload>>(`${this.apiUrl}/sgi/bootstrap`);
  }

  // ==========================================
  // 2. Proyectos
  // ==========================================

  /**
   * Listado paginado de proyectos con filtros de búsqueda y estado.
   * GET /sgi/projects
   */
  getProjects(params?: ProjectFilterParams): Observable<SgiPaginatedResponse<ProjectListItem>> {
    let httpParams = new HttpParams();

    if (params) {
      if (params.search) {
        httpParams = httpParams.set('search', params.search);
      }
      if (params.department_id !== undefined && params.department_id !== null) {
        httpParams = httpParams.set('department_id', params.department_id.toString());
      }
      if (params.requesting_unit_id !== undefined && params.requesting_unit_id !== null) {
        httpParams = httpParams.set('requesting_unit_id', params.requesting_unit_id.toString());
      }
      if (params.status_id !== undefined && params.status_id !== null) {
        httpParams = httpParams.set('status_id', params.status_id.toString());
      }
      if (params.is_default !== undefined && params.is_default !== null) {
        httpParams = httpParams.set('is_default', String(params.is_default));
      }
      if (params.per_page !== undefined && params.per_page !== null) {
        httpParams = httpParams.set('per_page', params.per_page.toString());
      }
      if (params.page !== undefined && params.page !== null) {
        httpParams = httpParams.set('page', params.page.toString());
      }
    }

    return this.http.get<SgiPaginatedResponse<ProjectListItem>>(`${this.apiUrl}/sgi/projects`, {
      params: httpParams,
    });
  }

  /**
   * Crea un nuevo proyecto (vacío o clonado desde la plantilla por defecto).
   * POST /sgi/projects
   */
  createProject(dto: CreateProjectDto): Observable<SgiApiResponse<Project>> {
    return this.http.post<SgiApiResponse<Project>>(`${this.apiUrl}/sgi/projects`, dto);
  }

  /**
   * Obtiene el detalle completo del proyecto con etapas, fases y requisitos.
   * GET /sgi/projects/{project}
   */
  getProject(projectId: number): Observable<SgiApiResponse<Project>> {
    return this.http.get<SgiApiResponse<Project>>(`${this.apiUrl}/sgi/projects/${projectId}`);
  }

  /**
   * Actualiza los datos básicos del proyecto.
   * PUT /sgi/projects/{project}
   */
  updateProject(projectId: number, dto: UpdateProjectDto): Observable<SgiApiResponse<Project>> {
    return this.http.put<SgiApiResponse<Project>>(`${this.apiUrl}/sgi/projects/${projectId}`, dto);
  }

  /**
   * Clona etapas, fases y requisitos de otro proyecto hacia este (o viceversa).
   * POST /sgi/projects/{project}/clone
   */
  cloneProject(projectId: number, dto?: CloneProjectDto): Observable<SgiApiResponse<Project>> {
    return this.http.post<SgiApiResponse<Project>>(
      `${this.apiUrl}/sgi/projects/${projectId}/clone`,
      dto ?? {},
    );
  }

  /**
   * Obtiene los documentos del proyecto agrupados por fase.
   * GET /sgi/projects/{project}/documents
   */
  getProjectDocuments(projectId: number): Observable<SgiApiResponse<ProjectPhaseDocumentGroup[]>> {
    return this.http.get<SgiApiResponse<ProjectPhaseDocumentGroup[]>>(
      `${this.apiUrl}/sgi/projects/${projectId}/documents`,
    );
  }

  /**
   * Obtiene el historial de auditoría y transiciones de fases del proyecto.
   * GET /sgi/projects/{project}/history
   */
  getProjectHistory(projectId: number): Observable<SgiApiResponse<ProjectHistoryItem[]>> {
    return this.http.get<SgiApiResponse<ProjectHistoryItem[]>>(
      `${this.apiUrl}/sgi/projects/${projectId}/history`,
    );
  }

  // ==========================================
  // 3. Workflow (Avance y Retroceso)
  // ==========================================

  /**
   * Avanza el flujo del proyecto a la siguiente fase.
   * Revalida en servidor los requisitos obligatorios de la fase actual.
   * POST /sgi/projects/{project}/advance
   */
  advanceWorkflow(
    projectId: number,
    dto?: AdvanceWorkflowDto,
  ): Observable<SgiApiResponse<WorkflowAdvanceResponse>> {
    return this.http.post<SgiApiResponse<WorkflowAdvanceResponse>>(
      `${this.apiUrl}/sgi/projects/${projectId}/advance`,
      dto ?? {},
    );
  }

  /**
   * Retrocede el flujo del proyecto reabriendo la fase anterior.
   * Requiere un comentario obligatorio (motivo).
   * POST /sgi/projects/{project}/retreat
   */
  retreatWorkflow(
    projectId: number,
    dto: RetreatWorkflowDto,
  ): Observable<SgiApiResponse<WorkflowRetreatResponse>> {
    return this.http.post<SgiApiResponse<WorkflowRetreatResponse>>(
      `${this.apiUrl}/sgi/projects/${projectId}/retreat`,
      dto,
    );
  }

  // ==========================================
  // 4. Etapas
  // ==========================================

  /**
   * Agrega una etapa al final del proyecto.
   * POST /sgi/projects/{project}/stages
   */
  createStage(projectId: number, dto: CreateStageDto): Observable<SgiApiResponse<Stage>> {
    return this.http.post<SgiApiResponse<Stage>>(
      `${this.apiUrl}/sgi/projects/${projectId}/stages`,
      dto,
    );
  }

  /**
   * Reordena las etapas abiertas del proyecto.
   * POST /sgi/projects/{project}/stages/reorder
   */
  reorderStages(projectId: number, dto: ReorderStagesDto): Observable<SgiApiResponse<Stage[]>> {
    return this.http.post<SgiApiResponse<Stage[]>>(
      `${this.apiUrl}/sgi/projects/${projectId}/stages/reorder`,
      dto,
    );
  }

  /**
   * Actualiza los datos de una etapa abierta.
   * PUT /sgi/stages/{stage}
   */
  updateStage(stageId: number, dto: UpdateStageDto): Observable<SgiApiResponse<Stage>> {
    return this.http.put<SgiApiResponse<Stage>>(`${this.apiUrl}/sgi/stages/${stageId}`, dto);
  }

  // ==========================================
  // 5. Fases
  // ==========================================

  /**
   * Agrega una fase al final de una etapa abierta.
   * POST /sgi/stages/{stage}/phases
   */
  createPhase(stageId: number, dto: CreatePhaseDto): Observable<SgiApiResponse<Phase>> {
    return this.http.post<SgiApiResponse<Phase>>(`${this.apiUrl}/sgi/stages/${stageId}/phases`, dto);
  }

  /**
   * Reordena las fases abiertas de una etapa.
   * POST /sgi/stages/{stage}/phases/reorder
   */
  reorderPhases(stageId: number, dto: ReorderPhasesDto): Observable<SgiApiResponse<Phase[]>> {
    return this.http.post<SgiApiResponse<Phase[]>>(
      `${this.apiUrl}/sgi/stages/${stageId}/phases/reorder`,
      dto,
    );
  }

  /**
   * Obtiene el detalle completo de una fase: requisitos, pendientes, archivos y comentarios.
   * GET /sgi/phases/{phase}
   */
  getPhase(phaseId: number): Observable<SgiApiResponse<Phase>> {
    return this.http.get<SgiApiResponse<Phase>>(`${this.apiUrl}/sgi/phases/${phaseId}`);
  }

  /**
   * Actualiza una fase abierta.
   * PUT /sgi/phases/{phase}
   */
  updatePhase(phaseId: number, dto: UpdatePhaseDto): Observable<SgiApiResponse<Phase>> {
    return this.http.put<SgiApiResponse<Phase>>(`${this.apiUrl}/sgi/phases/${phaseId}`, dto);
  }

  // ==========================================
  // 6. Requisitos de Fase
  // ==========================================

  /**
   * Agrega un nuevo requisito a una fase abierta.
   * POST /sgi/phases/{phase}/requirements
   */
  createRequirement(
    phaseId: number,
    dto: CreateRequirementDto,
  ): Observable<SgiApiResponse<PhaseRequirement>> {
    return this.http.post<SgiApiResponse<PhaseRequirement>>(
      `${this.apiUrl}/sgi/phases/${phaseId}/requirements`,
      dto,
    );
  }

  /**
   * Actualiza un requisito de una fase abierta.
   * PUT /sgi/requirements/{requirement}
   */
  updateRequirement(
    requirementId: number,
    dto: UpdateRequirementDto,
  ): Observable<SgiApiResponse<PhaseRequirement>> {
    return this.http.put<SgiApiResponse<PhaseRequirement>>(
      `${this.apiUrl}/sgi/requirements/${requirementId}`,
      dto,
    );
  }

  /**
   * Desactiva un requisito (no elimina físicamente, establece deactivated_at).
   * DELETE /sgi/requirements/{requirement}
   */
  deactivateRequirement(requirementId: number): Observable<SgiApiResponse<PhaseRequirement>> {
    return this.http.delete<SgiApiResponse<PhaseRequirement>>(
      `${this.apiUrl}/sgi/requirements/${requirementId}`,
    );
  }

  // ==========================================
  // 7. Archivos de Fase
  // ==========================================

  /**
   * Sube un archivo asociado a un requisito o hito de la fase.
   * Admite FormData directo o un DTO tipado con File.
   * POST /sgi/phases/{phase}/files (Content-Type: multipart/form-data)
   */
  uploadPhaseFile(
    phaseId: number,
    data: FormData | UploadPhaseFileDto,
  ): Observable<SgiApiResponse<ProjectPhaseFile>> {
    let body: FormData;

    if (data instanceof FormData) {
      body = data;
    } else {
      body = new FormData();
      body.append('file', data.file);
      if (data.requirement_id !== undefined && data.requirement_id !== null) {
        body.append('requirement_id', data.requirement_id.toString());
      }
      if (data.milestone_id !== undefined && data.milestone_id !== null) {
        body.append('milestone_id', data.milestone_id.toString());
      }
    }

    return this.http.post<SgiApiResponse<ProjectPhaseFile>>(
      `${this.apiUrl}/sgi/phases/${phaseId}/files`,
      body,
    );
  }

  /**
   * Elimina lógicamente un archivo de fase.
   * DELETE /sgi/files/{file}
   */
  deleteFile(fileId: number): Observable<SgiApiResponse<ProjectPhaseFile>> {
    return this.http.delete<SgiApiResponse<ProjectPhaseFile>>(`${this.apiUrl}/sgi/files/${fileId}`);
  }

  // ==========================================
  // 8. Comentarios de Fase
  // ==========================================

  /**
   * Agrega un comentario en una fase.
   * POST /sgi/phases/{phase}/comments
   */
  createPhaseComment(
    phaseId: number,
    dto: CreatePhaseCommentDto,
  ): Observable<SgiApiResponse<ProjectPhaseComment>> {
    return this.http.post<SgiApiResponse<ProjectPhaseComment>>(
      `${this.apiUrl}/sgi/phases/${phaseId}/comments`,
      dto,
    );
  }

  /**
   * Marca un comentario como resuelto.
   * POST /sgi/comments/{comment}/resolve
   */
  resolveComment(commentId: number): Observable<SgiApiResponse<ProjectPhaseComment>> {
    return this.http.post<SgiApiResponse<ProjectPhaseComment>>(
      `${this.apiUrl}/sgi/comments/${commentId}/resolve`,
      {},
    );
  }

  // ==========================================
  // 9. Hitos de Fase
  // ==========================================

  /**
   * Obtiene el listado de hitos de una fase.
   * GET /sgi/phases/{phase}/milestones
   */
  getPhaseMilestones(phaseId: number): Observable<SgiApiResponse<ProjectMilestone[]>> {
    return this.http.get<SgiApiResponse<ProjectMilestone[]>>(
      `${this.apiUrl}/sgi/phases/${phaseId}/milestones`,
    );
  }

  /**
   * Crea un hito en la fase indicada.
   * POST /sgi/phases/{phase}/milestones
   */
  createMilestone(
    phaseId: number,
    dto: CreateMilestoneDto,
  ): Observable<SgiApiResponse<ProjectMilestone>> {
    return this.http.post<SgiApiResponse<ProjectMilestone>>(
      `${this.apiUrl}/sgi/phases/${phaseId}/milestones`,
      dto,
    );
  }

  /**
   * Actualiza un hito existente.
   * PUT /sgi/milestones/{milestone}
   */
  updateMilestone(
    milestoneId: number,
    dto: UpdateMilestoneDto,
  ): Observable<SgiApiResponse<ProjectMilestone>> {
    return this.http.put<SgiApiResponse<ProjectMilestone>>(
      `${this.apiUrl}/sgi/milestones/${milestoneId}`,
      dto,
    );
  }

  /**
   * Elimina lógicamente (soft delete) un hito.
   * DELETE /sgi/milestones/{milestone}
   */
  deleteMilestone(milestoneId: number): Observable<SgiApiResponse<ProjectMilestone>> {
    return this.http.delete<SgiApiResponse<ProjectMilestone>>(
      `${this.apiUrl}/sgi/milestones/${milestoneId}`,
    );
  }
}