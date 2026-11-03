import { Project } from '../../mantenedor-proyectos/models/project.interface';

/** Proyecto de prueba con la forma real de GET /sgi/projects/{id}: sin `icon` en las fases. */
export function buildProject(overrides: Partial<Project> = {}): Project {
  const req = (id: number, name: string, extra: Record<string, unknown> = {}) => ({
    id,
    phase_id: 0,
    name,
    type: 'document' as const,
    is_required: true,
    group_key: null,
    sort_order: id,
    is_active: true,
    is_completed: false,
    deactivated_at: null,
    ...extra,
  });

  // Etapas y fases en desorden a propósito: el estado debe ordenarlas.
  return {
    id: 7,
    internal_code: 'INFRA-007',
    name: 'Edificio Aulas',
    description: null,
    department_id: null,
    department: null,
    requesting_unit_id: null,
    requesting_unit: null,
    status_id: null,
    status: null,
    is_default: false,
    created_at: null,
    updated_at: null,
    current_phase: { id: 12, name: 'Revisión', sort_order: 2, layout: 'standard' },
    stages: [
      {
        id: 2,
        name: 'Ejecución',
        color: '#0d6efd',
        sort_order: 2,
        phases: [
          {
            id: 21,
            name: 'Obra',
            sort_order: 1,
            layout: 'milestones',
            closed_at: null,
            closed_by: null,
          },
        ],
      },
      {
        id: 1,
        name: 'Diseño',
        color: '#8a2be2',
        sort_order: 1,
        phases: [
          {
            id: 12,
            name: 'Revisión',
            sort_order: 2,
            layout: 'standard',
            closed_at: null,
            closed_by: null,
            requirements: [
              req(3, 'Informe B', { group_key: 'informe', is_completed: true }),
              req(2, 'Informe A', { group_key: 'informe' }),
              req(1, 'Planos'),
              req(4, 'Extra', { is_required: false }),
              req(5, 'Desactivado', { is_active: false, is_completed: true, deactivated_at: '2026-10-01' }),
            ],
          },
          {
            id: 11,
            name: 'Borrador',
            sort_order: 1,
            layout: 'standard',
            closed_at: '2026-10-02T10:00:00Z',
            closed_by: 'Ana',
            requirements: [req(6, 'Brief', { is_completed: true })],
          },
        ],
      },
    ],
    ...overrides,
  } as Project;
}
