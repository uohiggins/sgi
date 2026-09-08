import {
  Directive,
  effect,
  EmbeddedViewRef,
  inject,
  Input,
  signal,
  TemplateRef,
  ViewContainerRef,
} from '@angular/core';
import { AuthService } from '../services/auth-service';

export type PermissionMode = 'any' | 'all';
type PermissionInput = string | string[] | null | undefined;

@Directive({
  selector: '[uohHasPermission]',
  standalone: true,
})
export class UohHasPermissionDirective {
  private readonly templateRef = inject(TemplateRef<unknown>);
  private readonly viewContainerRef = inject(ViewContainerRef);
  private readonly authService = inject(AuthService);
  private readonly permissions = signal<string[]>([]);
  private readonly mode = signal<PermissionMode>('any');
  private viewRef: EmbeddedViewRef<unknown> | null = null;

  constructor() {
    effect(() => {
      this.render(this.canShow());
    });
  }

  @Input()
  set uohHasPermission(value: PermissionInput) {
    this.permissions.set(this.normalizePermissions(value));
  }

  @Input()
  set uohHasPermissionMode(value: PermissionMode | null | undefined) {
    this.mode.set(value === 'all' ? 'all' : 'any');
  }

  private canShow(): boolean {
    const permissions = this.permissions();

    if (permissions.length === 0) {
      return false;
    }

    return this.mode() === 'all'
      ? this.authService.hasAllPermissions(permissions)
      : this.authService.hasAnyPermission(permissions);
  }

  private render(canShow: boolean): void {
    if (canShow && !this.viewRef) {
      this.viewRef = this.viewContainerRef.createEmbeddedView(this.templateRef);
      return;
    }

    if (!canShow && this.viewRef) {
      this.viewContainerRef.clear();
      this.viewRef = null;
    }
  }

  private normalizePermissions(value: PermissionInput): string[] {
    const permissions = Array.isArray(value) ? value : [value];

    return permissions
      .map((permission) => (typeof permission === 'string' ? permission.trim() : ''))
      .filter((permission) => permission.length > 0);
  }
}
