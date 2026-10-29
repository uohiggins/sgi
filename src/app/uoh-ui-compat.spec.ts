/**
 * Prueba de compatibilidad de uoh-ui con Angular 22 / ng-select 24.0.2.
 *
 * uoh-ui se compiló contra Angular 21 y ng-select 21.x, por lo que se valida aquí que
 * <uoh-user-select> siga funcionando con las versiones que usa este proyecto. Este spec
 * puede retirarse cuando uoh-ui se recompile contra Angular 22 / ng-select 24.
 */
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { of } from 'rxjs';
import {
  UOH_USER_SELECT_DATA_SOURCE,
  UohUserOption,
  UohUserSelect,
  UohUserSelectDataSource,
  UohUserSelectValue,
} from 'uoh-ui';

const SAMPLE_USERS: readonly UohUserOption[] = [
  { id: 1, name: 'Ana', last_name: 'Pérez', full_name: 'Ana Pérez', email: 'ana.perez@uoh.cl' },
  { id: 2, name: 'Carlos', last_name: 'Soto', full_name: 'Carlos Soto', email: 'carlos.soto@uoh.cl' },
];

@Component({
  selector: 'sgi-uoh-ui-compat-host',
  standalone: true,
  imports: [FormsModule, UohUserSelect],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <uoh-user-select
      labelForId="compat-user-select"
      placeholder="Seleccione persona de prueba"
      [users]="users"
      [ngModel]="selectedUserId()"
      (ngModelChange)="selectedUserId.set($event)"
    />
  `,
})
class UohUserSelectCompatHost {
  readonly users = SAMPLE_USERS;
  readonly selectedUserId = signal<UohUserSelectValue>(null);
}

describe('uoh-ui compatibility (uoh-user-select with ng-select 24.0.2)', () => {
  let fixture: ComponentFixture<UohUserSelectCompatHost>;
  let host: UohUserSelectCompatHost;

  beforeEach(async () => {
    const dataSource: UohUserSelectDataSource = {
      getPage: () =>
        of({
          data: [...SAMPLE_USERS],
          current_page: 1,
          last_page: 1,
          per_page: 50,
          total: SAMPLE_USERS.length,
        }),
      getById: (id) => of({ ...SAMPLE_USERS[0], id }),
    };

    await TestBed.configureTestingModule({
      imports: [UohUserSelectCompatHost],
      providers: [{ provide: UOH_USER_SELECT_DATA_SOURCE, useValue: dataSource }],
    }).compileComponents();

    fixture = TestBed.createComponent(UohUserSelectCompatHost);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  async function settle(): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  async function openDropdown(): Promise<void> {
    const arrowWrapper = (fixture.nativeElement as HTMLElement).querySelector(
      '.ng-arrow-wrapper',
    ) as HTMLElement;
    expect(arrowWrapper).toBeTruthy();

    arrowWrapper.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0 }));
    await settle();
  }

  it('should render uoh-user-select and the underlying ng-select container', () => {
    const el: HTMLElement = fixture.nativeElement;

    expect(el.querySelector('uoh-user-select')).toBeTruthy();
    expect(el.querySelector('ng-select.custom-ng-select')).toBeTruthy();
    expect(el.querySelector('.ng-placeholder')?.textContent?.trim()).toBe(
      'Seleccione persona de prueba',
    );
  });

  it('should resolve and display the selected user when a value is set', async () => {
    host.selectedUserId.set(1);
    await settle();
    await settle();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.user-identity__name')?.textContent?.trim()).toBe('Ana Pérez');
    expect(el.querySelector('.user-identity__email')?.textContent?.trim()).toBe(
      'ana.perez@uoh.cl',
    );
  });

  it('should open the dropdown in the CDK overlay and render the options', async () => {
    await openDropdown();

    const names = Array.from(
      document.body.querySelectorAll('.ng-option .user-identity__name'),
    ).map((node) => node.textContent?.trim());

    expect(names).toEqual(['Ana Pérez', 'Carlos Soto']);
  });

  it('should select an option from the dropdown', async () => {
    await openDropdown();

    const options = document.body.querySelectorAll<HTMLElement>('.ng-option');
    expect(options.length).toBe(2);

    options[1].click();
    await settle();
    await settle();

    expect(host.selectedUserId()).toBe(2);
  });
});
