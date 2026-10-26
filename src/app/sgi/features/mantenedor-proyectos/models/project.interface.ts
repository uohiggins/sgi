/**
 * Tipos e interfaces de dominio para el módulo SGI (Mantenedor de Proyectos)
 * Basado estrictamente en los modelos Eloquent y controladores de la API Laravel.
 * Formato de propiedades: snake_case (reflejo 1:1 del backend).
 */

// ==========================================
// 1. Envelope genérico de respuesta API SGI
// ==========================================
export interface SgiApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface SgiPaginationMeta {
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
}

export interface SgiPaginatedData<T> {
  items: T[];
  pagination: SgiPaginationMeta;
}

export type SgiPaginatedResponse<T> = SgiApiResponse<SgiPaginatedData<T>>;

// ==========================================
// 2. Entidades de soporte y catálogos globales
// ==========================================
export interface OrganizationalUnitRef {
  id: number;
  name: string;
  parent_id?: number | null;
  sap?: number | null;
  organization?: number | null;
  unity?: string | null;
  subunity?: string | null;
}

export interface Department extends OrganizationalUnitRef {}
export interface RequestingUnit extends OrganizationalUnitRef {}

export interface UserRef {
  id: number;
  name: string;
  last_name?: string | null;
  email?: string | null;
}

export interface ProjectStatus {
  id: number;
  name: string;
  hex_color: string;
  created_at?: string;
  updated_at?: string;
}

// ==========================================
// 3. Requisitos, Hitos, Archivos y Comentarios
// ==========================================
export type RequirementType = 'document' | 'milestone';

export interface PhaseRequirement {
  id: number;
  phase_id: number;
  name: string;
  type: RequirementType;
  is_required: boolean;
  group_key: string | null;
  sort_order: number;
  is_active?: boolean;
  is_completed?: boolean;
  deactivated_at: string | null;
  created_at?: string;
  updated_at?: string;
}

export type MilestoneStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export interface ProjectMilestone {
  id: number;
  phase_id?: number;
  requirement_id: number | null;
  requirement_name?: string | null;
  name: string;
  description?: string | null;
  status: MilestoneStatus;
  planned_date: string | null;
  actual_date: string | null;
  responsible?: string | null;
  responsible_id: number | null;
  responsible_name?: string | null;
  responsible_user?: UserRef | null;
  created_at?: string;
  updated_at?: string;
}

export interface ProjectPhaseFile {
  id: number;
  phase_id?: number;
  requirement_id: number | null;
  requirement_name?: string | null;
  milestone_id: number | null;
  milestone_name?: string | null;
  uploaded_by: number | string | null;
  uploaded_by_user?: UserRef | null;
  name: string;
  file_path: string;
  disk?: string;
  file_size: number | null;
  mime_type: string | null;
  was_uploaded_after_close: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ProjectPhaseComment {
  id: number;
  phase_id?: number;
  user_id: number;
  user_name?: string | null;
  user?: UserRef | null;
  comment: string;
  resolved_at: string | null;
  resolved_by: number | string | null;
  resolved_by_user?: UserRef | null;
  is_resolved?: boolean;
  was_created_after_close: boolean;
  created_at?: string;
  updated_at?: string;
}

// ==========================================
// 4. Fases y Etapas (Workflow)
// ==========================================
export type PhaseLayout = 'standard' | 'milestones';

export interface PhaseCurrentSummary {
  id: number;
  name: string;
  sort_order: number;
  layout: PhaseLayout;
}

export interface Phase {
  id: number;
  stage_id?: number;
  stage_name?: string | null;
  project_id?: number;
  project_name?: string | null;
  name: string;
  sort_order: number;
  layout: PhaseLayout;
  closed_at: string | null;
  closed_by: string | UserRef | null;
  is_closed?: boolean;
  is_completed?: boolean;
  pending_count?: number;
  requirements?: PhaseRequirement[];
  files?: ProjectPhaseFile[];
  comments?: ProjectPhaseComment[];
  milestones?: ProjectMilestone[];
  created_at?: string;
  updated_at?: string;
}

export interface Stage {
  id: number;
  project_id?: number;
  name: string;
  color: string | null;
  sort_order: number;
  phases?: Phase[];
  deleted_status?: boolean;
  created_at?: string;
  updated_at?: string;
}

// ==========================================
// 5. Transiciones de Fase
// ==========================================
export interface ProjectPhaseTransition {
  id?: number;
  project_id: number;
  phase_id?: number | null;
  from_phase_id?: number | null;
  to_phase_id?: number | null;
  action: string;
  user_id: number;
  user?: UserRef | null;
  comment?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at?: string;
  updated_at?: string;
}

// ==========================================
// 6. Proyectos (Detalle y Listado)
// ==========================================
export interface ProjectListItem {
  id: number;
  internal_code: string | null;
  name: string;
  description: string | null;
  department_id: number | null;
  department: string | null;
  requesting_unit_id: number | null;
  requesting_unit: string | null;
  status_id: number | null;
  status: string | null;
  status_color?: string | null;
  is_default: boolean;
  created_at: string | null;
  updated_at: string | null;
  actions?: Record<string, boolean>;
}


export interface Project {
  id: number;
  internal_code: string | null;
  name: string;
  description: string | null;
  department_id: number | null;
  department: string | Department | null;
  requesting_unit_id: number | null;
  requesting_unit: string | RequestingUnit | null;
  status_id: number | null;
  status: string | ProjectStatus | null;
  is_default: boolean;
  current_phase?: PhaseCurrentSummary | null;
  stages?: Stage[];
  actions?: Record<string, boolean>;
  created_at: string | null;
  updated_at: string | null;
}

// ==========================================
// 7. Parámetros de consulta y DTOs de Proyectos
// ==========================================
export interface ProjectFilterParams {
  search?: string;
  department_id?: number;
  requesting_unit_id?: number;
  status_id?: number;
  is_default?: boolean;
  per_page?: number;
  page?: number;
}

export interface CreateProjectDto {
  name: string;
  internal_code?: string | null;
  description?: string | null;
  department_id?: number | null;
  requesting_unit_id?: number | null;
  status_id?: number | null;
  is_default?: boolean;
  from_default?: boolean;
}

export interface UpdateProjectDto {
  name?: string;
  internal_code?: string | null;
  description?: string | null;
  department_id?: number | null;
  requesting_unit_id?: number | null;
  status_id?: number | null;
  is_default?: boolean;
}

export interface CloneProjectDto {
  source_project_id?: number | null;
  name?: string | null;
}

export interface ProjectPhaseDocumentGroup {
  phase_id: number;
  phase_name: string;
  stage_id: number;
  stage_name?: string | null;
  closed_at: string | null;
  files: ProjectPhaseFile[];
}

export interface ProjectHistoryItem {
  id: number;
  action: string;
  phase_id?: number | null;
  phase_name?: string | null;
  from_phase_id?: number | null;
  from_phase_name?: string | null;
  to_phase_id?: number | null;
  to_phase_name?: string | null;
  user_id: number;
  user_name?: string | null;
  comment?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at?: string;
}

// ==========================================
// 8. DTOs de Workflow
// ==========================================
export interface AdvanceWorkflowDto {
  comment?: string;
}

export interface RetreatWorkflowDto {
  comment: string;
}

export interface WorkflowAdvanceResponse {
  closed_phase: {
    id: number;
    name: string;
    closed_at: string | null;
  };
  current_phase: PhaseCurrentSummary | null;
  is_finished: boolean;
}

export interface WorkflowRetreatResponse {
  reopened_phase: PhaseCurrentSummary;
  current_phase: PhaseCurrentSummary;
}

// ==========================================
// 9. DTOs de Etapas
// ==========================================
export interface CreateStageDto {
  name: string;
  color?: string | null;
}

export interface UpdateStageDto {
  name?: string;
  color?: string | null;
}

export interface StageReorderItem {
  id: number;
  sort_order: number;
}

export interface ReorderStagesDto {
  stages: StageReorderItem[];
}

// ==========================================
// 10. DTOs de Fases
// ==========================================
export interface CreatePhaseDto {
  name: string;
  layout?: PhaseLayout;
}

export interface UpdatePhaseDto {
  name?: string;
  layout?: PhaseLayout;
}

export interface PhaseReorderItem {
  id: number;
  sort_order: number;
}

export interface ReorderPhasesDto {
  phases: PhaseReorderItem[];
}

// ==========================================
// 11. DTOs de Requisitos
// ==========================================
export interface CreateRequirementDto {
  name: string;
  type: RequirementType;
  is_required?: boolean;
  group_key?: string | null;
  sort_order?: number;
}

export interface UpdateRequirementDto {
  name?: string;
  type?: RequirementType;
  is_required?: boolean;
  group_key?: string | null;
  sort_order?: number;
}

// ==========================================
// 12. DTOs de Archivos y Comentarios
// ==========================================
export interface UploadPhaseFileDto {
  file: File;
  requirement_id?: number | null;
  milestone_id?: number | null;
}

export interface CreatePhaseCommentDto {
  comment: string;
}

// ==========================================
// 13. DTOs de Hitos
// ==========================================
export interface CreateMilestoneDto {
  name: string;
  requirement_id?: number | null;
  planned_date?: string | null;
  actual_date?: string | null;
  responsible?: string | null;
  responsible_id?: number | null;
  status?: MilestoneStatus;
}

export interface UpdateMilestoneDto {
  name?: string;
  requirement_id?: number | null;
  planned_date?: string | null;
  actual_date?: string | null;
  responsible?: string | null;
  responsible_id?: number | null;
  status?: MilestoneStatus;
}

// ==========================================
// 14. Payloads de Sistema (Health y Bootstrap)
// ==========================================
export interface SgiHealthPayload {
  module: string;
  status: string;
  version: string;
}

export interface UserProfileData {
  id: number;
  name: string;
  last_name: string;
  email: string;
  path_img?: string | null;
  path_img_url?: string | null;
  path_banner?: string | null;
  path_banner_url?: string | null;
  email_verified_at?: string | null;
  is_active: boolean;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface SgiBootstrapPayload {
  user: UserProfileData | null;
  application_id: string | null;
  permissions: string[];
}