import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CommonService } from '../shared/common.service';

@Injectable({
    providedIn: 'root'
})
export class VacantesService {
    private FAST_API = 'http://127.0.0.1:8000/vacantes';

    constructor(private http: HttpClient, private commonService: CommonService) { }

    getVacantes(): Observable<any[]> {
        return this.http.get<any[]>(this.FAST_API);
    }

    getCiclos(): Observable<any[]> {
      return this.http.get<any[]>(`http://127.0.0.1:8000/ciclos`);
    }

    crearVacante(vacante: any): Observable<any> {
        return this.http.post<any>(this.FAST_API, vacante, this.commonService.headersPython);
    }

    actualizarVacante(id: number, vacanteCompleta: any): Observable<any> {
      return this.http.put<any>(`${this.FAST_API}/${id}`, vacanteCompleta, this.commonService.headersPython);
    }

    borrarVacante(id: number): Observable<any> {
        return this.http.delete<any>(`${this.FAST_API}/${id}`, this.commonService.headersPython);
    }

    getAsignaciones(): Observable<any[]> {
      return this.http.get<any[]>(`http://127.0.0.1:8000/asignaciones`);
    }

    borrarAsignacion(idAsig: number): Observable<any> {
      return this.http.delete(`http://127.0.0.1:8000/asignaciones/${idAsig}`, this.commonService.headersPython);
    }

    getAlumnosLibres(): Observable<any[]> {
      return this.http.get<any[]>(`http://127.0.0.1:8000/alumnos-libres`, this.commonService.headersPython);
    }

    asignarAlumno(idVacante: number, idAlumno: number): Observable<any> {
      // el backend espera {id_vacante, id_alumno} en el body
      return this.http.post(`http://127.0.0.1:8000/asignaciones`, { id_vacante: idVacante, id_alumno: idAlumno }, this.commonService.headersPython);
    }


}
