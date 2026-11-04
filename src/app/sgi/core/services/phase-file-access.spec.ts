import { HttpErrorResponse, HttpHeaders, HttpResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { PhaseFileAccess } from './phase-file-access';
import { SgiApiService } from './sgi-api.service';

describe('PhaseFileAccess', () => {
  let access: PhaseFileAccess;
  const downloadFile = vi.fn();
  const tab = { opener: 'x', close: vi.fn(), location: { href: '' } };

  const reply = (type: string) =>
    of(new HttpResponse({ body: new Blob(['x'], { type }), headers: new HttpHeaders({ 'Content-Type': type }) }));

  beforeEach(() => {
    downloadFile.mockReset();
    tab.close.mockReset();
    tab.location.href = '';
    TestBed.configureTestingModule({ providers: [{ provide: SgiApiService, useValue: { downloadFile } }] });
    access = TestBed.inject(PhaseFileAccess);
    vi.spyOn(window, 'open').mockReturnValue(tab as unknown as Window);
    URL.createObjectURL = vi.fn(() => 'blob:test');
    URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => vi.restoreAllMocks());

  it('canView: solo extensiones y tipos seguros', () => {
    expect(access.canView({ name: 'a.PDF', mime_type: 'application/pdf' })).toBe(true);
    expect(access.canView({ name: 'foto.jpeg', mime_type: null })).toBe(true);
    expect(access.canView({ name: 'logo.svg', mime_type: 'image/svg+xml' })).toBe(false);
    expect(access.canView({ name: 'pagina.html', mime_type: 'text/html' })).toBe(false);
    expect(access.canView({ name: 'a.pdf', mime_type: 'text/html' })).toBe(false);
    expect(access.canView({ name: 'sin-extension', mime_type: 'application/pdf' })).toBe(false);
  });

  it('download crea un enlace con el nombre original y libera la URL', async () => {
    vi.useFakeTimers();
    downloadFile.mockReturnValue(reply('application/pdf'));
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    const created: HTMLAnchorElement[] = [];
    const create = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = create(tag);
      if (tag === 'a') created.push(el as HTMLAnchorElement);
      return el;
    });

    const result = await access.download({ id: 5, name: 'Informe final.pdf' });

    expect(result).toBeNull();
    expect(downloadFile).toHaveBeenCalledWith(5);
    expect(click).toHaveBeenCalled();
    expect(created[0].download).toBe('Informe final.pdf');
    expect(URL.revokeObjectURL).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1000);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:test');
    vi.useRealTimers();
  });

  it('view abre la pestaña de forma síncrona y le asigna la URL al terminar', async () => {
    downloadFile.mockReturnValue(reply('application/pdf'));

    const pending = access.view({ id: 5, name: 'a.pdf', mime_type: 'application/pdf' });
    expect(window.open).toHaveBeenCalledTimes(1); // antes de resolver la petición
    expect(tab.opener).toBeNull();

    expect(await pending).toBeNull();
    expect(downloadFile).toHaveBeenCalledWith(5, true);
    expect(tab.location.href).toBe('blob:test');
    expect(tab.close).not.toHaveBeenCalled();
  });

  it('view rechaza tipos no seguros sin abrir pestaña ni pedir el archivo', async () => {
    const result = await access.view({ id: 6, name: 'logo.svg', mime_type: 'image/svg+xml' });

    expect(result).toContain('Descargar');
    expect(window.open).not.toHaveBeenCalled();
    expect(downloadFile).not.toHaveBeenCalled();
  });

  it('view cierra la pestaña si el servidor responde un tipo no seguro', async () => {
    downloadFile.mockReturnValue(reply('image/svg+xml'));

    const result = await access.view({ id: 7, name: 'a.png', mime_type: null });

    expect(result).toContain('Descargar');
    expect(tab.close).toHaveBeenCalled();
    expect(tab.location.href).toBe('');
  });

  it('view informa si el navegador bloquea la pestaña', async () => {
    vi.spyOn(window, 'open').mockReturnValue(null);

    const result = await access.view({ id: 8, name: 'a.pdf', mime_type: null });

    expect(result).toContain('bloqueó');
    expect(downloadFile).not.toHaveBeenCalled();
  });

  it.each([
    [403, 'No tiene permiso'],
    [404, 'ya no está disponible'],
    [500, 'No se pudo obtener'],
  ])('error %i: mensaje claro y la pestaña se cierra', async (status, fragment) => {
    downloadFile.mockReturnValue(throwError(() => new HttpErrorResponse({ status })));

    const viewed = await access.view({ id: 9, name: 'a.pdf', mime_type: null });
    const downloaded = await access.download({ id: 9, name: 'a.pdf' });

    expect(viewed).toContain(fragment);
    expect(downloaded).toContain(fragment);
    expect(tab.close).toHaveBeenCalledTimes(1);
  });
});
