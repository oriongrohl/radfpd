import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonService } from '../shared/common.service';
import { URL_API } from 'src/environments/environment';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})

export class AlumnosService {
    // Definir como propiedad de la clase
    readonly FAST_API = 'http://127.0.0.1:8000';
    readonly ENDPOINT = 'alumnos';

    constructor(private http: HttpClient, private commonService: CommonService) { }

    getAlumnos(): Observable<any> {
      //! Usamos MI_API_LOCAL en lugar de URL_API q es la URL en la que se ejecuta el backend python INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
      return this.http.get(`${this.FAST_API}/${this.ENDPOINT}`, { headers: this.commonService.headers });
    }

    getEntidades(): Observable<any[]> {
      return this.http.get<any[]>(`${this.FAST_API}/entidades-centros`, { headers: this.commonService.headers });
    }

    addAlumno(alumno: any): Observable<any> {
        return this.http.post(`${this.FAST_API}/${this.ENDPOINT}`, alumno, { headers: this.commonService.headers });
    }

    deleteAlumno(id: number): Observable<any> {
        return this.http.delete(`${this.FAST_API}/${this.ENDPOINT}/${id}`, { headers: this.commonService.headers });
    }

    // para el formulario de alumnos (solo lo de tecnología 1-9)
    getCiclosTecnologia(): Observable<any[]> {
        return this.http.get<any[]>(`${this.FAST_API}/ciclos?solo_tecnologia=true`, { headers: this.commonService.headers });
    }

    // para el modal de asignacion
    getAlumnosLibres(): Observable<any[]> {
        return this.http.get<any[]>(`${this.FAST_API}/alumnos/libres`, { headers: this.commonService.headers });
    }

    updateAlumno(id: number, datos: any) { return this.http.put(`${this.FAST_API}/${this.ENDPOINT}/${id}`, datos, { headers: this.commonService.headers }); }

}
