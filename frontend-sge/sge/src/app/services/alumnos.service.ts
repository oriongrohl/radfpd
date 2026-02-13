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
    readonly MI_API_LOCAL = 'http://127.0.0.1:8000';
    readonly ENDPOINT = 'alumnos.php'; 

    constructor(private http: HttpClient, private commonService: CommonService) { }

    getAlumnos(): Observable<any> {
    // Usamos MI_API_LOCAL en lugar de URL_API q es la URL en la que se ejecuta el backend python INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
    return this.http.get(`${this.MI_API_LOCAL}/${this.ENDPOINT}`, { headers: this.commonService.headers });
    }

    addAlumno(alumno: any): Observable<any> {
        return this.http.post(`${this.MI_API_LOCAL}/${this.ENDPOINT}`, alumno, { headers: this.commonService.headers });
    }

    deleteAlumno(id: number): Observable<any> {
        return this.http.delete(`${this.MI_API_LOCAL}/${this.ENDPOINT}/${id}`, { headers: this.commonService.headers });
    }
}