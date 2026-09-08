import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { map, Observable } from 'rxjs';
import { User } from '../../auth/interfaces/user';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  constructor() {}

  private http = inject(HttpClient);
  private apiUrl = `${environment.API_URL}/users`;

  getAll(): Observable<User[]> {
    return this.http
      .get<any>(this.apiUrl)
      .pipe(
        map((response: any) => (Array.isArray(response) ? response : response.data || [response])),
      );
  }

  getById(id: number | string): Observable<User> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(map((res) => res.data || res));
  }
}
