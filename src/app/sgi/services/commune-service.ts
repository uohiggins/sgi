import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { map, Observable } from 'rxjs';
import { Commune } from '../interfaces/commune';

@Injectable({
  providedIn: 'root'
})
export class CommuneService {

  constructor() { }

  private http = inject(HttpClient);
  private apiUrl = `${environment.API_URL}`;

  getAll(): Observable<Commune[]> {
    return this.http
      .get<any>(`${this.apiUrl}/communes`)
      .pipe(
        map((response: any) => (Array.isArray(response) ? response : response.data || [response])),
      );
  }

  getById(id: number | string): Observable<Commune> {
    return this.http.get<any>(`${this.apiUrl}/commune/${id}`).pipe(map((res) => res.data || res));
  }

  getByRegion(regionId: number | string): Observable<Commune[]> {
    return this.http
      .get<any>(`${this.apiUrl}/region/${regionId}/communes`)
      .pipe(map((response: any) => response.data || response || []));
  }

}
