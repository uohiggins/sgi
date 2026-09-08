import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { School } from '../interfaces/school';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SchoolService {
  constructor() {}

  private http = inject(HttpClient);
  private apiUrl = `${environment.API_URL}`;

  getAll(): Observable<School[]> {
    return this.http
      .get<any>(`${this.apiUrl}/schools`)
      .pipe(
        map((response: any) => (Array.isArray(response) ? response : response.data || [response])),
      );
  }

  getById(id: number | string): Observable<School> {
    return this.http.get<any>(`${this.apiUrl}/school/${id}`).pipe(map((res) => res.data || res));
  }
}
