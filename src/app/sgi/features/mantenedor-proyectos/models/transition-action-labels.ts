/**
 * Etiquetas en español de los códigos de acción del historial de transiciones.
 * Lista completa según los `recordTransition(...)` del backend (SgiWorkflowService y controladores SGI).
 */
export const TRANSITION_ACTION_LABELS: Readonly<Record<string, string>> = {
  project_created: 'Proyecto creado',
  project_cloned: 'Proyecto clonado',
  project_structure_cloned: 'Estructura clonada',
  workflow_advance: 'Fase avanzada',
  workflow_retreat: 'Fase retrocedida',
  stage_created: 'Etapa creada',
  stages_reordered: 'Etapas reordenadas',
  phase_created: 'Fase creada',
  phases_reordered: 'Fases reordenadas',
  requirement_created: 'Requisito creado',
  requirement_deactivated: 'Requisito desactivado',
  milestone_created: 'Hito creado',
  milestone_updated: 'Hito actualizado',
  milestone_deleted: 'Hito eliminado',
  comment_created: 'Comentario agregado',
  comment_resolved: 'Comentario resuelto',
  file_uploaded: 'Archivo subido',
  file_deleted: 'Archivo eliminado',
};

/** Etiqueta del código; si es desconocido devuelve el código original. */
export function transitionActionLabel(action: string | null | undefined): string {
  if (!action) return '—';
  return TRANSITION_ACTION_LABELS[action.toLowerCase()] ?? action;
}
