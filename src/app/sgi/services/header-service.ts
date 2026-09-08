import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class HeaderService {
  constructor() {}

  private titleSubject = new BehaviorSubject<string>('Inicio');
  private subTitleSubject = new BehaviorSubject<string>('');

  title = this.titleSubject.asObservable();
  subTitle = this.subTitleSubject.asObservable();

  setTitle(title: string) {
    this.titleSubject.next(title);
  }
  setSubTitle(subTitle: string) {
    this.subTitleSubject.next(subTitle);
  }
}
