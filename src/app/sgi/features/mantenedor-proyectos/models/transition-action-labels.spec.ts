import { TRANSITION_ACTION_LABELS, transitionActionLabel } from './transition-action-labels';

describe('transitionActionLabel', () => {
  it('traduce códigos conocidos', () => {
    expect(transitionActionLabel('file_uploaded')).toBe('Archivo subido');
    expect(transitionActionLabel('file_deleted')).toBe('Archivo eliminado');
    expect(transitionActionLabel('workflow_advance')).toBe('Fase avanzada');
  });

  it('acepta el código en mayúsculas', () => {
    expect(transitionActionLabel('FILE_UPLOADED')).toBe('Archivo subido');
  });

  it('un código desconocido se muestra tal cual', () => {
    expect(transitionActionLabel('algo_nuevo')).toBe('algo_nuevo');
    expect(transitionActionLabel('ALGO_NUEVO')).toBe('ALGO_NUEVO');
  });

  it('un valor vacío muestra un guion', () => {
    expect(transitionActionLabel(null)).toBe('—');
    expect(transitionActionLabel('')).toBe('—');
  });

  it('cubre los 18 códigos del backend', () => {
    expect(Object.keys(TRANSITION_ACTION_LABELS).length).toBe(18);
  });
});
