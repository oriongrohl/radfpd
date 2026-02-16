import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class VacantesService {
    private apiUrl = 'http://127.0.0.1:8000/vacantes.php';

    constructor(private http: HttpClient) { }

    getVacantes(): Observable<any[]> {
        return this.http.get<any[]>(this.apiUrl);
    }

    crearVacante(vacante: any): Observable<any> {
        return this.http.post<any>(this.apiUrl, vacante);
    }

    actualizarVacante(id: number, num_vacantes: number): Observable<any> {
        // Recuerda que el backend espera solo el número de vacantes en el PUT
        return this.http.put<any>(`${this.apiUrl}/${id}`, { num_vacantes });
    }

    borrarVacante(id: number): Observable<any> {
        return this.http.delete<any>(`${this.apiUrl}/${id}`);
    }
}