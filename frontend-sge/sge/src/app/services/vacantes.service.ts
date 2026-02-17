import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class VacantesService {
    private FAST_API = 'http://127.0.0.1:8000/vacantes';

    constructor(private http: HttpClient) { }

    getVacantes(): Observable<any[]> {
        return this.http.get<any[]>(this.FAST_API);
    }

    getCiclos(): Observable<any[]> {
      return this.http.get<any[]>(`http://127.0.0.1:8000/ciclos`);
    }

    crearVacante(vacante: any): Observable<any> {
        return this.http.post<any>(this.FAST_API, vacante);
    }

    actualizarVacante(id: number, vacanteCompleta: any): Observable<any> {
      return this.http.put<any>(`${this.FAST_API}/${id}`, vacanteCompleta);
    }

    borrarVacante(id: number): Observable<any> {

        return this.http.delete<any>(`${this.FAST_API}/${id}`);
    }

    getAsignacionesByVacante(idVacante: number): Observable<any[]> {
      return this.http.get<any[]>(`${this.FAST_API}/asignaciones/vacante/${idVacante}`);
    }

    getAlumnosLibres(idCiclo: number, curso: number): Observable<any[]> {
      // Filtramos por ciclo y curso para que coincidan con la vacante
      return this.http.get<any[]>(`${this.FAST_API}/alumnos/libres?id_ciclo=${idCiclo}&curso=${curso}`);
    }

    asignarAlumno(idVacante: number, idAlumno: number): Observable<any> {
      return this.http.post(`${this.FAST_API}/asignaciones`, { id_vacante: idVacante, id_alumno: idAlumno });
    }

    desvincularAlumno(idVacante: number, idAlumno: number): Observable<any> {
      // Ajusta la ruta según tu backend (usualmente un DELETE con ambos IDs)
      return this.http.delete(`${this.FAST_API}/asignaciones/${idVacante}/${idAlumno}`);
    }

}
