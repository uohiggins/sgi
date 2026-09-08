import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { map, Observable } from 'rxjs';
import { Region } from '../interfaces/region';

@Injectable({
  providedIn: 'root'
})
export class RegionService {

  constructor() { }

  private http = inject(HttpClient);
  private apiUrl = `${environment.API_URL}`;

  getAll(): Observable<Region[]> {
    return this.http
      .get<any>(`${this.apiUrl}/regions`)
      .pipe(
        map((response: any) => (Array.isArray(response) ? response : response.data || [response])),
      );
  }

  getById(id: number | string): Observable<Region> {
    return this.http.get<any>(`${this.apiUrl}/region/${id}`).pipe(map((res) => res.data || res));
  }

}
