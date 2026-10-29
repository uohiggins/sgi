import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { HomePage } from './home-page';

describe('HomePage', () => {
  let fixture: ComponentFixture<HomePage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomePage],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(HomePage);
    fixture.detectChanges();
  });

  it('should render the page with the link to the projects maintainer', () => {
    const el: HTMLElement = fixture.nativeElement;

    expect(el.querySelector('.sgi-home-page')).toBeTruthy();
    expect(el.querySelector('a[href="/mantenedor-proyectos"]')).toBeTruthy();
  });
});
