import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UohxTimeline, UohxTimelineStep } from './uohx-timeline';

const STEPS: readonly UohxTimelineStep[] = [
  { label: 'Uno', icon: 'fa-file-lines' },
  { label: 'Dos', icon: 'fa-file-lines' },
  { label: 'Tres', icon: 'fa-file-lines' },
  { label: 'Cuatro', icon: 'fa-file-lines' },
];

@Component({
  selector: 'sgi-uohx-timeline-host',
  standalone: true,
  imports: [UohxTimeline],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <uohx-timeline
      [steps]="steps"
      [currentStep]="current()"
      [furthestStep]="furthest()"
      [color]="color()"
      [completedUpTo]="completedUpTo()"
      (stepSelect)="selected.set($event.index)"
    />
  `,
})
class Host {
  readonly steps = STEPS;
  readonly current = signal(0);
  readonly furthest = signal(2);
  readonly color = signal<string | null>(null);
  readonly completedUpTo = signal<number | null>(null);
  readonly selected = signal<number | null>(null);
}

describe('UohxTimeline', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;

  const stepStates = (): string[] =>
    Array.from(fixture.nativeElement.querySelectorAll('.step-item')).map((el) => {
      const cl = (el as HTMLElement).classList;
      return ['active', 'completed', 'reached', 'blocked'].find((c) => cl.contains(c)) ?? '';
    });

  const lineStates = (): string[] =>
    Array.from(fixture.nativeElement.querySelectorAll('.step-line')).map((el) => {
      const cl = (el as HTMLElement).classList;
      return cl.contains('line-completed') ? 'completed' : cl.contains('line-reached') ? 'reached' : '';
    });

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
  });

  it('mantiene el comportamiento original sin color ni completedUpTo', async () => {
    host.current.set(1);
    host.furthest.set(2);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(stepStates()).toEqual(['completed', 'active', 'reached', 'blocked']);
    expect(lineStates()).toEqual(['completed', 'reached', '']);
    const el = fixture.nativeElement.querySelector('uohx-timeline') as HTMLElement;
    expect(el.style.getPropertyValue('--uohx-active-color')).toBe('');
  });

  it('muestra como completados los pasos anteriores a completedUpTo aunque se mire otro paso', async () => {
    host.current.set(0);
    host.furthest.set(2);
    host.completedUpTo.set(2);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(stepStates()).toEqual(['active', 'completed', 'reached', 'blocked']);
    expect(lineStates()).toEqual(['completed', 'reached', '']);
  });

  it('con completedUpTo igual a la fase abierta, las fases vistas quedan completadas', async () => {
    host.current.set(2);
    host.furthest.set(2);
    host.completedUpTo.set(2);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(stepStates()).toEqual(['completed', 'completed', 'active', 'blocked']);
  });

  it('aplica el color como variable CSS', async () => {
    host.color.set('#8a2be2');
    fixture.detectChanges();
    await fixture.whenStable();

    const el = fixture.nativeElement.querySelector('uohx-timeline') as HTMLElement;
    expect(el.style.getPropertyValue('--uohx-active-color')).toBe('#8a2be2');
    expect(el.style.getPropertyValue('--uohx-completed-color')).toBe('#8a2be2');
  });

  it('emite stepSelect solo para pasos hasta furthestStep', async () => {
    host.furthest.set(1);
    fixture.detectChanges();
    await fixture.whenStable();

    const items = fixture.nativeElement.querySelectorAll('.step-item') as NodeListOf<HTMLElement>;
    items[3].click();
    expect(host.selected()).toBeNull();
    items[1].click();
    expect(host.selected()).toBe(1);
  });
});
