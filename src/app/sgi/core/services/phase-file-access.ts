import { HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ProjectPhaseFile } from '../../features/mantenedor-proyectos/models/project.interface';
import { SgiApiService } from './sgi-api.service';

/** Mismos tipos que el backend sirve en línea; SVG, HTML y cualquier otro quedan fuera. */
export const SAFE_INLINE_MIME_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
] as const;

const SAFE_INLINE_EXTENSIONS = ['pdf', 'png', 'jpg', 'jpeg', 'gif', 'webp'];

const REVOKE_DELAY_MS = 60_000;

/** `null` si salió bien; si no, el mensaje para el usuario. */
export type FileAccessResult = string | null;

/** Ver y descargar archivos de fase vía API (blob), sin usar `file_path`. */
@Injectable({ providedIn: 'root' })
export class PhaseFileAccess {
  private readonly api = inject(SgiApiService);

  /** Decide por extensión del nombre y, si el registro lo trae, por su tipo MIME. */
  canView(file: Pick<ProjectPhaseFile, 'name' | 'mime_type'>): boolean {
    const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
    if (!SAFE_INLINE_EXTENSIONS.includes(extension)) return false;
    return !file.mime_type || this.isSafeMime(file.mime_type);
  }

  async download(file: Pick<ProjectPhaseFile, 'id' | 'name'>): Promise<FileAccessResult> {
    try {
      const response = await firstValueFrom(this.api.downloadFile(file.id));
      const blob = response.body;
      if (!blob) return 'El servidor devolvió un archivo vacío.';

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.name;
      link.rel = 'noopener';
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      return null;
    } catch (error) {
      return this.messageFor(error);
    }
  }

  /**
   * Abre la pestaña de forma síncrona (el clic aún cuenta como gesto del usuario) y le asigna
   * la URL del blob al terminar la petición; si falla, la cierra.
   */
  async view(file: Pick<ProjectPhaseFile, 'id' | 'name' | 'mime_type'>): Promise<FileAccessResult> {
    if (!this.canView(file)) return 'Este tipo de archivo no se puede visualizar; use Descargar.';

    const tab = window.open('', '_blank');
    if (!tab) return 'El navegador bloqueó la pestaña nueva. Permita las ventanas emergentes o use Descargar.';
    tab.opener = null;

    try {
      const response = await firstValueFrom(this.api.downloadFile(file.id, true));
      const blob = response.body;
      const type = (response.headers.get('Content-Type') ?? blob?.type ?? '').split(';')[0].trim().toLowerCase();

      if (!blob || !this.isSafeMime(type)) {
        tab.close();
        return 'El servidor no permite visualizar este archivo en línea; use Descargar.';
      }

      const url = URL.createObjectURL(new Blob([blob], { type }));
      tab.location.href = url;
      setTimeout(() => URL.revokeObjectURL(url), REVOKE_DELAY_MS);
      return null;
    } catch (error) {
      tab.close();
      return this.messageFor(error);
    }
  }

  private isSafeMime(mime: string): boolean {
    return (SAFE_INLINE_MIME_TYPES as readonly string[]).includes(mime.split(';')[0].trim().toLowerCase());
  }

  private messageFor(error: unknown): string {
    const status = error instanceof HttpErrorResponse ? error.status : 0;
    if (status === 403) return 'No tiene permiso para acceder a este archivo.';
    if (status === 404) return 'El archivo ya no está disponible.';
    return 'No se pudo obtener el archivo. Intente nuevamente.';
  }
}
