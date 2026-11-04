import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import Swal from 'sweetalert2/dist/sweetalert2.esm.all.js';
import { UohModal } from 'uoh-ui';
import { SgiApiService } from '../../../../core/services/sgi-api.service';
import { PhaseFileAccess } from '../../../../core/services/phase-file-access';
import { PhaseFileActions } from '../../../../ui/phase-file-actions/phase-file-actions';
import {
  ProjectHistoryItem,
  ProjectListItem,
  ProjectPhaseDocumentGroup,
  ProjectPhaseFile,
  SgiPaginationMeta,
} from '../../models/project.interface';
import { transitionActionLabel } from '../../models/transition-action-labels';

@Component({
  selector: 'sgi-mantenedor-proyectos-page',
  standalone: true,
  imports: [DatePipe, PhaseFileActions, RouterLink, UohModal],
  templateUrl: './mantenedor-proyectos-page.html',
  styleUrl: './mantenedor-proyectos-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MantenedorProyectosPage implements OnInit {
  private readonly sgiApiService = inject(SgiApiService);
  private readonly fileAccess = inject(PhaseFileAccess);

  readonly historyModal = viewChild<UohModal>('historyModal');
  readonly documentsModal = viewChild<UohModal>('documentsModal');

  // Estados reactivos principales
  readonly projects = signal<ProjectListItem[]>([]);
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  // Paginación y búsqueda
  readonly searchTerm = signal<string>('');
  readonly currentPage = signal<number>(1);
  readonly perPage = signal<number>(15);
  readonly pagination = signal<SgiPaginationMeta>({
    total: 0,
    per_page: 15,
    current_page: 1,
    last_page: 1,
  });

  // Estados de modales
  readonly activeModal = signal<'history' | 'documents' | null>(null);
  readonly selectedProject = signal<ProjectListItem | null>(null);
  readonly modalLoading = signal<boolean>(false);
  readonly modalError = signal<string | null>(null);
  readonly fileError = signal<string | null>(null);
  readonly historyItems = signal<ProjectHistoryItem[]>([]);
  readonly documentGroups = signal<ProjectPhaseDocumentGroup[]>([]);

  // Computed
  readonly isEmpty = computed(() => !this.loading() && this.projects().length === 0);
  readonly totalProjects = computed(() => this.pagination().total);

  readonly actionLabel = transitionActionLabel;

  ngOnInit(): void {
    this.loadProjects();
  }

  loadProjects(): void {
    this.loading.set(true);
    this.error.set(null);

    const term = this.searchTerm().trim();
    this.sgiApiService
      .getProjects({
        page: this.currentPage(),
        per_page: this.perPage(),
        search: term || undefined,
      })
      .subscribe({
        next: (response) => {
          this.projects.set(response.data.items);
          this.pagination.set(response.data.pagination);
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Error al cargar proyectos:', err);
          this.error.set('No se pudo cargar el listado de proyectos. Intente nuevamente.');
          this.loading.set(false);
        },
      });
  }

  onSearch(term: string): void {
    this.searchTerm.set(term);
    this.currentPage.set(1);
    this.loadProjects();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.pagination().last_page || page === this.currentPage()) {
      return;
    }
    this.currentPage.set(page);
    this.loadProjects();
  }

  changePerPage(size: number): void {
    this.perPage.set(size);
    this.currentPage.set(1);
    this.loadProjects();
  }

  // Acciones por fila
  onViewDetail(project: ProjectListItem): void {
    Swal.fire({
      icon: 'info',
      title: 'Próximamente',
      text: `La vista de detalle para el proyecto "${project.name}" se habilitará en la siguiente fase.`,
      confirmButtonText: 'Entendido',
      confirmButtonColor: '#EAB308',
    });
  }

  openHistoryModal(project: ProjectListItem): void {
    this.selectedProject.set(project);
    this.activeModal.set('history');
    this.modalLoading.set(true);
    this.modalError.set(null);
    this.historyItems.set([]);
    this.historyModal()?.open();

    this.sgiApiService.getProjectHistory(project.id).subscribe({
      next: (response) => {
        this.historyItems.set(response.data);
        this.modalLoading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar historial:', err);
        this.modalError.set('No fue posible cargar el historial del proyecto.');
        this.modalLoading.set(false);
      },
    });
  }

  openDocumentsModal(project: ProjectListItem): void {
    this.selectedProject.set(project);
    this.activeModal.set('documents');
    this.modalLoading.set(true);
    this.modalError.set(null);
    this.documentGroups.set([]);
    this.fileError.set(null);
    this.documentsModal()?.open();

    this.sgiApiService.getProjectDocuments(project.id).subscribe({
      next: (response) => {
        this.documentGroups.set(response.data);
        this.modalLoading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar documentos:', err);
        this.modalError.set('No fue posible cargar los documentos del proyecto.');
        this.modalLoading.set(false);
      },
    });
  }

  async viewFile(file: ProjectPhaseFile): Promise<void> {
    this.fileError.set(await this.fileAccess.view(file));
  }

  async downloadFile(file: ProjectPhaseFile): Promise<void> {
    this.fileError.set(await this.fileAccess.download(file));
  }

  closeModal(): void {
    const current = this.activeModal();
    this.activeModal.set(null);
    this.fileError.set(null);
    this.selectedProject.set(null);
    this.historyItems.set([]);
    this.documentGroups.set([]);
    this.modalError.set(null);

    if (current === 'history') {
      this.historyModal()?.close();
    } else if (current === 'documents') {
      this.documentsModal()?.close();
    }
  }

  onModalHidden(modal: 'history' | 'documents'): void {
    if (this.activeModal() === modal) {
      this.closeModal();
    }
  }

  getTextColor(hex?: string | null): string {
    if (!hex) return '#ffffff';
    const clean = hex.replace('#', '');
    if (clean.length !== 6) return '#ffffff';
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 150 ? '#1f2937' : '#ffffff';
  }

  formatFileSize(bytes?: number | null): string {
    if (!bytes || bytes <= 0) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  trackByProjectId(_index: number, project: ProjectListItem): number {
    return project.id;
  }
}
