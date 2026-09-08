import {AsyncPipe, DOCUMENT} from '@angular/common';
import {ChangeDetectionStrategy, Component, inject, signal, OnInit, OnDestroy} from '@angular/core';
import {AuthService} from '../../../auth/services/auth-service';
import {HeaderService} from '../../../sgi/services/header-service';

@Component({
    selector: 'uoh-header',
    standalone: true,
    imports: [AsyncPipe],
    templateUrl: './uoh-header.html',
    styleUrl: './uoh-header.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})

export class UohHeader implements OnInit, OnDestroy {
    authService = inject(AuthService);
    public title;
    public subTitle;

    private document = inject(DOCUMENT);

    // Obtenemos el objeto window de forma segura en Angular
    private window = this.document.defaultView;
    // Ahora la señal incluye 'auto' y la dejamos por defecto
    viewMode = signal<'light' | 'dark' | 'auto'>('auto');

    // Variables para escuchar los cambios del sistema
    private mediaQueryList: MediaQueryList | null = null;
    private mediaQueryListener!: (event: MediaQueryListEvent) => void;

    constructor(private headerService: HeaderService) {
        this.title = this.headerService.title;
        this.subTitle = this.headerService.subTitle;
    }

    ngOnDestroy(): void {
        // throw new Error("Method not implemented.");

        // Limpieza de memoria para evitar "memory leaks"
        if (this.mediaQueryList && this.mediaQueryListener) {
            this.mediaQueryList?.removeEventListener('change', this.mediaQueryListener);
        }
    }

    ngOnInit(): void {
        // throw new Error("Method not implemented.");

        // 1. Configuramos el "escuchador" del sistema operativo
        if (this.window && this.window.matchMedia) {
            this.mediaQueryList = this.window?.matchMedia('(prefers-color-scheme: dark)') ?? null;

            this.mediaQueryListener = (event: MediaQueryListEvent) => {
                // Solo cambiamos el DOM automáticamente si el usuario está en modo 'auto'
                if (this.viewMode() === 'auto') {
                    this.applyThemeToDOM(event.matches ? 'dark' : 'light');
                }
            };

            // Activamos el escuchador
            this.mediaQueryList?.addEventListener('change', this.mediaQueryListener);
        }

        // 2. Aplicamos el tema inicial cuando carga el componente
        this.applyTheme(this.viewMode());
    }

    // Función que el botón ejecuta para rotar entre los 3 modos
    cycleTheme(): void {
        const current = this.viewMode();
        let nextMode: 'light' | 'dark' | 'auto' = 'auto';

        // Lógica del ciclo: auto -> light -> dark -> auto...
        if (current === 'auto') nextMode = 'light';
        else if (current === 'light') nextMode = 'dark';
        else if (current === 'dark') nextMode = 'auto';

        this.viewMode.set(nextMode);
        this.applyTheme(nextMode);
    }

    // Función interna para determinar qué se va a pintar
    private applyTheme(mode: 'light' | 'dark' | 'auto'): void {
        if (mode === 'auto') {
            // Si es auto, revisamos qué prefiere el sistema
            const isSystemDark = this.mediaQueryList?.matches ?? false;
            this.applyThemeToDOM(isSystemDark ? 'dark' : 'light');
        } else {
            // Si es manual, aplicamos el que el usuario eligió
            this.applyThemeToDOM(mode);
        }
    }

    // Función interna para modificar la etiqueta <html>
    private applyThemeToDOM(theme: 'light' | 'dark'): void {
        this.document.documentElement.setAttribute('data-bs-theme', theme);
    }
}
