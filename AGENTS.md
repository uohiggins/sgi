Las instrucciones de este proyecto están en frontend-instruccions.md y DECISIONS.md — léelos antes de trabajar aquí. El estado del trabajo en curso está en HANDOFF.md.

## Protocolo de trabajo entre agentes

- **Al empezar:** leer `AGENTS.md`, `DECISIONS.md` y `HANDOFF.md`; correr `git status` y `git log --oneline -10`.
- **Un agente por repo a la vez (los agentes comparten la carpeta de trabajo, así que un cambio de rama afecta a todos).**
- **Checkpoints:** hacer un commit (puede ser `wip: ...`) después de cada sub-paso verificado. Nunca terminar con el árbol sucio.
- **Al terminar, o si se acerca el límite de cuota:** actualizar `HANDOFF.md` (se sobrescribe, máximo una pantalla), comitear y dejar `git status` limpio.
- **UI nueva:** seguir la regla de uso de `uoh-ui` y componentes derivados `uohx-` de `frontend-instruccions.md` (sección "Uso de la librería uoh-ui"); no modificar la librería directamente.
- **Desconfiar de `HANDOFF.md`** si su fecha es vieja o contradice `git log`: preguntar al usuario antes de continuar.
