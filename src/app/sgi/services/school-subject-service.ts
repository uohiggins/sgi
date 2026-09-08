import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { SchoolSubject } from '../interfaces/school-subject';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SchoolSubjectService {
  constructor() { }

  private http = inject(HttpClient);
  private apiUrl = `${environment.API_URL}`;

  getAll(): Observable<SchoolSubject[]> {
    return this.http
      .get<any>(`${this.apiUrl}/school-subjects`)
      .pipe(
        map((response: any) => (Array.isArray(response) ? response : response.data || [response])),
      );
  }

  getById(id: number | string): Observable<SchoolSubject> {
    return this.http
      .get<any>(`${this.apiUrl}/school-subject/${id}`)
      .pipe(map((res) => res.data || res));
  }

  getByCareer(careerId: number | string): Observable<SchoolSubject[]> {
    return this.http
      .get<any>(`${this.apiUrl}/careers/${careerId}/subjects`)
      .pipe(map((response: any) => response.data || response || []));
  }
}
