import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})

export class AuthGuardService implements CanActivate {

  constructor(public auth: AuthService, public router: Router) {}

  async canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean> { // el metodo canActivate se ejecuta cada vez que se intenta acceder a una ruta protegida, y recibe como parametros la ruta a la que se intenta acceder y el estado de la ruta

    const response = await this.auth.isAuthenticated(state.url); // llamada al metodo para ver si esta o no autenticado
    return response;
  }

}