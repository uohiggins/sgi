import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { Career } from '../interfaces/career';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class CareerService {
  constructor() { }

  private http = inject(HttpClient);
  private apiUrl = `${environment.API_URL}`;

  getAll(): Observable<Career[]> {
    return this.http
      .get<any>(`${this.apiUrl}/careers`)
      .pipe(
        map((response: any) => (Array.isArray(response) ? response : response.data || [response])),
      );
  }

  getById(id: number | string): Observable<Career> {
    return this.http.get<any>(`${this.apiUrl}/career/${id}`).pipe(map((res) => res.data || res));
  }

  getBySchool(schoolId: number | string): Observable<Career[]> {
    return this.http
      .get<any>(`${this.apiUrl}/schools/${schoolId}/careers`)
      .pipe(map((response: any) => response.data || response || []));
  }
}
