import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { UOH_USER_SELECT_DATA_SOURCE, UohUserSelectDataSource } from 'uoh-ui';
import { HomePage } from './home-page';

describe('HomePage (uoh-user-select integration with ng-select 24.0.2)', () => {
  let fixture: ComponentFixture<HomePage>;
  let component: HomePage;
  let mockDataSource: UohUserSelectDataSource;

  beforeEach(async () => {
    mockDataSource = {
      getPage: () =>
        of({
          data: [
            {
              id: 1,
              name: 'Ana',
              last_name: 'Pérez',
              full_name: 'Ana Pérez',
              email: 'ana.perez@uoh.cl',
            },
            {
              id: 2,
              name: 'Carlos',
              last_name: 'Soto',
              full_name: 'Carlos Soto',
              email: 'carlos.soto@uoh.cl',
            },
          ],
          current_page: 1,
          last_page: 1,
          per_page: 50,
          total: 2,
        }),
      getById: (id) =>
        of({
          id,
          name: 'Ana',
          last_name: 'Pérez',
          full_name: 'Ana Pérez',
          email: 'ana.perez@uoh.cl',
        }),
    };

    await TestBed.configureTestingModule({
      imports: [HomePage],
      providers: [
        provideRouter([]),
        { provide: UOH_USER_SELECT_DATA_SOURCE, useValue: mockDataSource },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HomePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should render uoh-user-select and underlying ng-select 24.0.2 container', () => {
    const el: HTMLElement = fixture.nativeElement;
    const userSelect = el.querySelector('uoh-user-select');
    const ngSelect = el.querySelector('ng-select.custom-ng-select.user-select');
    const placeholder = el.querySelector('.ng-placeholder');

    expect(userSelect).toBeTruthy();
    expect(ngSelect).toBeTruthy();
    expect(placeholder?.textContent?.trim()).toBe('Seleccione persona de prueba');
  });

  it('should resolve and display selected user label via ng-label-tmp when value is set', async () => {
    component.selectedUserId.set(1);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    const nameEl = el.querySelector('.user-identity__name');
    const emailEl = el.querySelector('.user-identity__email');

    expect(nameEl?.textContent?.trim()).toBe('Ana Pérez');
    expect(emailEl?.textContent?.trim()).toBe('ana.perez@uoh.cl');
  });

  it('should open dropdown overlay and render options via ng-option-tmp with ng-select 24.0.2', async () => {
    const el: HTMLElement = fixture.nativeElement;
    const arrowWrapper = el.querySelector('.ng-arrow-wrapper') as HTMLElement;
    expect(arrowWrapper).toBeTruthy();

    arrowWrapper.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0 }));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const optionElements = document.body.querySelectorAll('.ng-option .user-identity__name');
    const names = Array.from(optionElements).map((node) => node.textContent?.trim());

    expect(names).toEqual(['Ana Pérez', 'Carlos Soto']);
  });
});
