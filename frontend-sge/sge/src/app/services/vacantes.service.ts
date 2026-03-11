import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CommonService } from '../shared/common.service';
import { environment } from 'src/environments/environment';
import { URL_PYTHON } from 'src/environments/environment';


@Injectable({
    providedIn: 'root'
})
export class VacantesService {

    constructor(private http: HttpClient, private commonService: CommonService) { }

    getVacantes(): Observable<any[]> {
        return this.http.get<any[]>(URL_PYTHON+`/vacantes`, this.commonService.headersPython);
    }

    getCiclos(): Observable<any[]> {
      return this.http.get<any[]>(URL_PYTHON+`/ciclos`, this.commonService.headersPython);
    }

    crearVacante(vacante: any): Observable<any> {
        return this.http.post<any>(URL_PYTHON, vacante, this.commonService.headersPython);
    }

    actualizarVacante(id: number, vacanteCompleta: any): Observable<any> {
      return this.http.put<any>(`${URL_PYTHON+`/vacantes`}/${id}`, vacanteCompleta, this.commonService.headersPython);
    }

    borrarVacante(id: number): Observable<any> {
        return this.http.delete<any>(`${URL_PYTHON+`/vacantes`}/${id}`, this.commonService.headersPython);
    }

    getAsignaciones(): Observable<any[]> {
      return this.http.get<any[]>(URL_PYTHON+`/vacantes`+`/asignaciones`, this.commonService.headersPython);
    }

    borrarAsignacion(idAsig: number): Observable<any> {
      return this.http.delete(URL_PYTHON+`/asignaciones/${idAsig}`, this.commonService.headersPython);
    }

    getAlumnosLibres(): Observable<any[]> {
      return this.http.get<any[]>(URL_PYTHON+`/alumnos-libres`, this.commonService.headersPython);
    }

    asignarAlumno(idVacante: number, idAlumno: number): Observable<any> {
      // el backend espera {id_vacante, id_alumno} en el body
      return this.http.post(URL_PYTHON+`/asignaciones`, { id_vacante: idVacante, id_alumno: idAlumno }, this.commonService.headersPython);
    }
    

}
