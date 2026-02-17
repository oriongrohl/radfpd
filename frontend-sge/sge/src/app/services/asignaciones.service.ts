import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
    export class AsignacionesService {
    // URL de tu backend FastAPI
    private apiUrl = 'http://127.0.0.1:8000';

    constructor(private http: HttpClient) { }

    // 1. Obtener todas las asignaciones actuales
    getAsignaciones(): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/asignaciones`);
    }

    // 2. Obtener solo los alumnos que no tienen empresa
    getAlumnosLibres(): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/alumnos-libres`);
    }

    // 3. Crear una nueva asignación (CORREGIDO)
    asignar(id_vacante: number, id_alumno: number): Observable<any> {
        const url = `${this.apiUrl}/asignaciones`;

        // Creamos el objeto que el backend espera recibir en el body
        const body = {
        id_vacante: id_vacante,
        id_alumno: id_alumno
        };

        // Enviamos el body como segundo argumento
        return this.http.post(url, body);
    }

    // 4. Eliminar una asignación
    borrarAsignacion(id_asig: number): Observable<any> {
        return this.http.delete(`${this.apiUrl}/asignaciones/${id_asig}`);
    }
}
