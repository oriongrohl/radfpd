import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class VacantesService {
    private apiUrl = 'http://127.0.0.1:8000/vacantes';

    constructor(private http: HttpClient) { }

    getVacantes(): Observable<any[]> {
        return this.http.get<any[]>(this.apiUrl);
    }

    getCiclos(): Observable<any[]> {
      return this.http.get<any[]>(`http://127.0.0.1:8000/ciclos`);
    }

    crearVacante(vacante: any): Observable<any> {
        return this.http.post<any>(this.apiUrl, vacante);
    }

    actualizarVacante(id: number, vacanteCompleta: any): Observable<any> {
      return this.http.put<any>(`${this.apiUrl}/${id}`, vacanteCompleta);
    }

    borrarVacante(id: number): Observable<any> {

        return this.http.delete<any>(`${this.apiUrl}/${id}`);
    }
}
