> OBSOLETO: este diseño fue reemplazado. Ver AGENTS.md / frontend-instruccions.md para el modelo vigente.

# Tarea: Generación de Base de Datos e Interfaces para el Mantenedor de Proyectos (SGI)

## 1. Migraciones y Modelos en Laravel (Backend)
Generar los modelos y migraciones en Laravel para el motor de flujo de trabajo del SGI. 

**Reglas Globales para Migraciones:**
* Todos los nombres de tablas exclusivas deben llevar el prefijo "sgi_" y estar en inglés pluralizado. 
* Todas las tablas deben incluir los campos `created_at` y `updated_at` configurados para tomar el valor de fecha y hora actual de la base de datos por defecto (usando `$table->timestamp('created_at')->useCurrent();` y `$table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();`).

Ejecuta `php artisan make:model -m` para cada entidad y genera las migraciones en este orden estricto para que las claves foráneas (`bigint unsigned`) compilen correctamente:

1. `sgi_project_statuses` (id, name, hex_color)
2. `sgi_projects` (id, internal_code, name)
   * FK: `department_id` -> references `id` on `organizational_units`
   * FK: `requesting_unit_id` -> references `id` on `organizational_units`
   * FK: `status_id` -> references `id` on `sgi_project_statuses`
3. `sgi_macro_stages` (id, name, hex_color, display_order integer)
4. `sgi_phases` (id, name, step_number integer)
   * FK: `macro_stage_id` -> references `id` on `sgi_macro_stages`
5. `sgi_phase_requirements` (id, requirement_name, is_mandatory boolean)
   * FK: `phase_id` -> references `id` on `sgi_phases`
6. `sgi_project_phases` (id, status enum['pending', 'in_progress', 'completed'] default 'pending')
   * FK: `project_id` -> references `id` on `sgi_projects` cascade on delete
   * FK: `phase_id` -> references `id` on `sgi_phases`
7. `sgi_project_phase_files` (id, original_name, storage_path)
   * FK: `project_phase_id` -> references `id` on `sgi_project_phases` cascade on delete
   * FK: `phase_requirement_id` nullable -> references `id` on `sgi_phase_requirements`
   * FK: `uploaded_by_user_id` -> references `id` on `users`
8. `sgi_project_phase_comments` (id, comment text)
   * FK: `project_phase_id` -> references `id` on `sgi_project_phases` cascade on delete
   * FK: `user_id` -> references `id` on `users`
9. `sgi_project_milestones` (id, milestone_name, comment text nullable, milestone_date date, assignee, attachment nullable)
   * FK: `project_id` -> references `id` on `sgi_projects` cascade on delete

*Restricción Laravel:* Asegúrate de que los Modelos incluyan la propiedad `$table` definiendo explícitamente el nombre con el prefijo `sgi_`. Configura las relaciones de Eloquent (`belongsTo`, `hasMany`) asegurando que los métodos que apuntan a `organizational_units` y `users` referencien los modelos globales correctos.

## 2. Interfaces en Angular (Frontend)
Dentro de la carpeta estricta `src/app/sgi/features/mantenedor-proyectos/models/`, genera el archivo `project.interface.ts`.

*Restricción Angular:* Escribe las interfaces tipadas mapeando los campos en inglés en formato `camelCase` (ej: `internalCode`, `macroStageId`). Exporta la interfaz principal `Project` (incluyendo las entidades anidadas de Department y RequestingUnit) y las interfaces de dominio `Phase`, `Requirement`, `Comment` y `Milestone`.