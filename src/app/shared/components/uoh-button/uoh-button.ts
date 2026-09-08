import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
} from '@angular/core';

type ButtonAction = 'add' | 'edit' | 'delete' | 'next' | 'prev' | 'info';
type ButtonSize = 'sm' | 'md' | 'lg' | 'xl' | string; // Permitimos string para tamaños custom como '50px'
type IconPosition = 'left' | 'right';

@Component({
  selector: 'uoh-button',
  standalone: true,
  templateUrl: './uoh-button.html',
  styleUrl: './uoh-button.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class UohButton {
  // Inputs como Signals
  action = input<ButtonAction>('add');
  iconPosition = input<IconPosition>('left');
  size = input<ButtonSize>('md');
  iconOnly = input<boolean>(false);

  private host = inject(ElementRef);

  // Detecta si hay texto proyectado
  readonly hasContent = computed(() => {
    return !!this.host.nativeElement.textContent?.trim();
  });

  // Determina si es solo icono
  readonly isIconOnly = computed(() => {
    return this.iconOnly() || !this.hasContent();
  });

  // Verifica si el tamaño es de los predefinidos
  readonly isPresetSize = computed(() => {
    const s = this.size();
    return ['sm', 'md', 'lg', 'xl'].includes(s);
  });

  // Mapeo de iconos según la acción
  readonly iconClass = computed(() => {
    const icons: Record<ButtonAction, string> = {
      add: 'fa-plus',
      edit: 'fa-pen',
      delete: 'fa-trash',
      next: 'fa-chevron-right',
      prev: 'fa-chevron-left',
      info: 'fa-circle-info',
    };
    return icons[this.action()];
  });
}
