import { Component, OnInit } from '@angular/core';
import { MenuService } from 'src/app/services/menu.service';
import { AuthService } from 'src/app/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {
  menu: any;
  username: string;
  grupo: string;
  vista: string;
  href: string;
  url: string; // || localStorage.getItem('usuario')

  constructor(private menuService: MenuService, private authService: AuthService, private router: Router) {
    this.getMenu();
  }

  ngOnInit() {
    this.username = localStorage.getItem('nombre_publico');
    this.grupo = localStorage.getItem('ultimoGrupo');
    this.vista = localStorage.getItem('ultimaOpcion');
  }

  salir() {
    this.authService.doLogout()
      .subscribe( response => {});
    this.router.navigate(['home']);
  }

  async getMenu() {
    const RESPONSE = await this.menuService.getMenu().toPromise();
    this.menu = RESPONSE.data;

    // --- INYECTAR MIS BOTONES A MANO ---
    const misOpciones = {
      grupo: 'Gestión FCT',
      opciones: [
        { 
          opcion: 'Alumnos', 
          accion: 'alumnos', 
          texto_tooltip: 'Listado y gestión de alumnos' 
        },
        { 
          opcion: 'Vacantes', 
          accion: 'vacantes', 
          texto_tooltip: 'Gestión de plazas y empresas' 
        }
      ]
    };

    // Añadimos nuestro grupo al principio o al final del menú
    this.menu.push(misOpciones); 
    // -----------------------------------
  }

  almacenarGrupo(grupo) {
    localStorage.setItem('ultimoGrupo', grupo);
  }

  actualizarVistaNavbar(opcion) {
    this.grupo = localStorage.getItem('ultimoGrupo');
    localStorage.setItem('ultimaOpcion', opcion);
    this.vista = opcion;
  }

  goPerfil() {
    localStorage.setItem('ultimoGrupo', 'Inicio');
    localStorage.setItem('ultimaOpcion', 'Perfil');
    this.router.navigate(['perfil']);
    this.ngOnInit();
  }

}
