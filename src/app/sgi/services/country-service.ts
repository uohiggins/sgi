import { inject, Injectable } from '@angular/core';
import { Country } from '../interfaces/country';
import { map, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class CountryService {
  constructor() {}

  private http = inject(HttpClient);
  private apiUrl = `${environment.API_URL}/countries`;

  getAll(): Observable<Country[]> {
    return this.http
      .get<any>(this.apiUrl)
      .pipe(
        map((response: any) => (Array.isArray(response) ? response : response.data || [response])),
      );
  }

  getById(id: number | string): Observable<Country> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(map((res) => res.data || res));
  }
}
