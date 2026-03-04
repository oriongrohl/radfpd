import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { Observable } from 'rxjs';
import { URL_API } from 'src/environments/environment';
import { CommonService } from '../shared/common.service';
import { ApiResponse } from '../shared/interfaces/api-response';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private http: HttpClient, private cookieService: CookieService, private commonService: CommonService) {}

  doLogin(data: any) {

    const body = JSON.stringify(data);
    return this.http.post<ApiResponse>(`${URL_API}/login.php`, body);
  }
  
  //! is authenticate dusa el auth guard
  public async isAuthenticated(url: string): Promise<boolean> { 

    // verificar si esta el token de python en el localstorage, si no esta, ni lo intentamos, no esta autenticado
    const tokenPython = localStorage.getItem('token_python');
    if (!tokenPython) {
        return false; // Si no hay token, ni lo intentamos, no está autenticado
    }

    // comprobamos si es una ruta python
    let ruta = url.substring(1).split('/')[0];
    if (ruta === 'alumnos' || ruta === 'vacantes' || ruta === 'asignaciones') {
        return true; // ok pq el  token existe
    }

    // logica de las rutas php
    return new Promise<boolean>((resolve) => {
        this.http.get<ApiResponse>(`${URL_API}/check_usuarios.php?ruta=${ruta}`, { headers: this.commonService.getHeaders() })
            .subscribe({
                next: (response) => resolve(response.ok),
                error: () => resolve(false)
            });
    });
  }

  //! LOGIN PARA PYTHON (Django Rest Framework)
  doLoginPython(data: any) { //! llamada al endpoint para obtener el token (comunicacion con el backend)
    return this.http.post<any>( 
      'http://127.0.0.1:8000/login',  // endpoint de login del backend de python, que nos devuelve el token 
      data
    );
  }

  doLogout() {
    const body = new FormData();
    const usuario = localStorage.getItem('usuario');
    body.append('user', usuario);
    this.cookieService.deleteAll();
    localStorage.clear();
    return this.http.post(`${URL_API}/logout.php`, body);
  }

  resetPassword(formularioCorreo) {
    const body = JSON.stringify(formularioCorreo);
    return this.http.post<ApiResponse>(`${URL_API}/olvidar_pwd.php`, body, {headers: this.commonService.headers});
  }

  checkPassToken(tokenPasswd: string) {

    const body = JSON.stringify({ token: tokenPasswd });

    return this.http.post<ApiResponse>(`${URL_API}/check_token_passwd.php`, body);
  }

  generateNewPass(data: any) {
    const body = JSON.stringify(data);

    return this.http.put<ApiResponse>(`${URL_API}/reset_pass.php`, body);

  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

}
