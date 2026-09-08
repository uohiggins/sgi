import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { CostCenter } from '../interfaces/cost-center';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class CostCenterService {
  constructor() {}

  private http = inject(HttpClient);
  private apiUrl = `${environment.API_URL}/cost-centers`;

  getAll(): Observable<CostCenter[]> {
    return this.http
      .get<any>(this.apiUrl)
      .pipe(
        map((response: any) => (Array.isArray(response) ? response : response.data || [response])),
      );
  }

  getById(id: number | string): Observable<CostCenter> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(map((res) => res.data || res));
  }
}
