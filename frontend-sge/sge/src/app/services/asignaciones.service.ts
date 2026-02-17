import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
    export class AsignacionesService {
    // URL backend FastAPI
    private FAST_API = 'http://127.0.0.1:8000';

    constructor(private http: HttpClient) { }

    // obtener todas las asignaciones actuales
    getAsignaciones(): Observable<any[]> {
        return this.http.get<any[]>(`${this.FAST_API}/asignaciones`);
    }

    // obtener solo los alumnos que no tienen empresa
    getAlumnosLibres(): Observable<any[]> {
        return this.http.get<any[]>(`${this.FAST_API}/alumnos-libres`);
    }

    // Crear una nueva asignacion corregido por fin inshallah
    asignar(id_vacante: number, id_alumno: number): Observable<any> {
        const url = `${this.FAST_API}/asignaciones`;

        // Creamos el objeto que el backend espera recibir en el body
        const body = {
        id_vacante: id_vacante,
        id_alumno: id_alumno
        };

        // Enviamos el body como segundo argumento
        return this.http.post(url, body);
    }

    // eliminar una asignacion
    borrarAsignacion(id_asig: number): Observable<any> {
        return this.http.delete(`${this.FAST_API}/asignaciones/${id_asig}`);
    }
}
