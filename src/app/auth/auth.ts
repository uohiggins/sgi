import {ChangeDetectionStrategy, Component, inject, signal, OnInit, OnDestroy} from '@angular/core';
import {FormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {AuthService} from './services/auth-service';
import {Router} from '@angular/router';
import {DOCUMENT} from '@angular/common';
import { environment } from '../../environments/environment';
import Swal from 'sweetalert2/dist/sweetalert2.esm.all.js';

@Component({
    selector: 'app-auth',
    imports: [ReactiveFormsModule],
    templateUrl: './auth.html',
    styleUrl: './auth.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Auth implements OnInit, OnDestroy {
    private readonly sessionTransportErrorCode = 'AUTH-C001';
    private formBuilder = inject(FormBuilder);
    authService = inject(AuthService);
    router = inject(Router);
    appName = environment.APP_NAME;

    passwordVisible = signal<boolean>(false);

    userForm = this.formBuilder.group({
        email: ['', Validators.required],
        password: ['', Validators.required],
    });

    private document = inject(DOCUMENT);

    // Obtenemos el objeto window de forma segura en Angular
    private window = this.document.defaultView;
    // Ahora la señal incluye 'auto' y la dejamos por defecto
    viewMode = signal<'light' | 'dark' | 'auto'>('auto');

    // Variables para escuchar los cambios del sistema
    private mediaQueryList: MediaQueryList | null = null;
    private mediaQueryListener!: (event: MediaQueryListEvent) => void;

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

    viewPassword() {
        console.log('View password clicked');
        const passwordInput = document.getElementById('password') as HTMLInputElement;
        const eye = document.getElementById('eye') as HTMLInputElement;
        const eyeSlash = document.getElementById('eyeSlash') as HTMLInputElement;
        if (passwordInput.type === 'password') {
            this.passwordVisible.set(true);
            passwordInput.type = 'text';
            eye.classList.add('d-none');
            eyeSlash.classList.remove('d-none');
        } else {
            this.passwordVisible.set(false);
            passwordInput.type = 'password';
            eye.classList.remove('d-none');
            eyeSlash.classList.add('d-none');
        }
    }

    onSubmit() {
        const {email, password} = this.userForm.value;
        this.authService.login({email: email!, password: password!}).subscribe({
            next: (session) => {
                if (!session) return;

                if (!environment.AUTH_USE_LOCAL_STORAGE_TOKEN) {
                    this.authService.loadSession({skipRefresh: true}).subscribe((isSessionValid) => {
                        if (!isSessionValid) {
                            this.showSessionTransportError();
                            return;
                        }

                        this.navigateAfterLogin();
                    });
                    return;
                }

                this.navigateAfterLogin();
            },
            error: (err) => console.error('Login failed', err),
        });
    }

    private navigateAfterLogin(): void {
        const route = this.authService.hasApplicationAccess()
            ? environment.HOME_ROUTE
            : environment.NO_ACCESS_ROUTE;

        this.router.navigateByUrl(route);
    }

    private showSessionTransportError(): void {
        Swal.fire({
            title: 'No se pudo completar el inicio de sesion',
            text: `Codigo de error: ${this.sessionTransportErrorCode}`,
            icon: 'error',
            confirmButtonText: 'Aceptar',
            showConfirmButton: true,
        });
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
