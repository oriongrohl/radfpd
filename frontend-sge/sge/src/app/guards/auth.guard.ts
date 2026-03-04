import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})

export class AuthGuardService implements CanActivate {

  constructor(public auth: AuthService, public router: Router) {}


  async canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean> {

    const response = await this.auth.isAuthenticated(state.url); // llamada al metodo para ver si esta o no autenticado

    if (!response) { // !si la respuesta es false, es que no esta autenticado, asi que redirigimos al login
      this.router.navigate(['/home']);
    }

    return response;
  }

}

