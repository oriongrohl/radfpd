import { HttpHeaders } from '@angular/common/http';
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { AuthService } from 'src/app/services/auth.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  @Output() valueChange = new EventEmitter();

  loginForm: FormGroup;
  titulo = 'Acceso CRM RADFPD';
  alerta: string;
  showSpinner: boolean;
  error: string;

  constructor(
              private authService: AuthService,
              private router: Router,
              private cookieService: CookieService,
              private snackBar: MatSnackBar,
              private route: ActivatedRoute
            ) { }

  ngOnInit() {
    this.setForm();
    this.route.queryParams.subscribe(params => {
        if (params['sesionExpira']) {
            this.snackBar.open('Su sesión ha expirado o es inválida. Por favor, identifíquese de nuevo.', 'Cerrar', {
                duration: 5000,
                panelClass: ['warning-snackbar'] // Opcional: para ponerle color naranja/rojo en CSS
            });
        }
    });
  }

  setForm() {
    this.loginForm = new FormGroup({
      username: new FormControl('', Validators.required),
      password: new FormControl('', Validators.required)
    });
  }


  async acceder() { // usamos async para poder usar await dentro del metodo acceder, que es lo que se ejecuta al hacker click en login
    // async = codigo asincrono, el codigo asincrono es aquel que no se ejecuta secuencialmente sino que puede esperar a que se resuelvan ciertas cosas y dp continuar
    if (this.loginForm.valid) { // quick check de que el formulario es valido

      const data = this.loginForm.value; // obtencion datos del formulario, que se enviaran al backend para obtener el token

      const RESPONSE = await this.authService.doLogin(data).toPromise(); // llamada al endpoint con await pq queremos esperar a que se resuelva la promesa antes de continuar, y toPromise() para convertir el observable en una promesa, ya que el metodo doLogin devuelve un observable
      // promise fuerza a esperar a recibir el token
      if (RESPONSE.ok) { // si el backend PHP devuelve ok es que el login es correcto, y el token se ha recibido correctamente

        if (RESPONSE.data.token) {

          //? login PHP

          localStorage.setItem('token', RESPONSE.data.token);
          localStorage.setItem('usuario', RESPONSE.data.usuario);
          localStorage.setItem('nombre_publico', RESPONSE.data.nombre_publico);
          localStorage.setItem('ultimaOpcion', RESPONSE.data.opcion);
          localStorage.setItem('ultimoGrupo', RESPONSE.data.grupo);

          //! login python a partir de aqui cambia el codigo antiguo

          try { // intentamos obtener el token de fastapi
            const RESPONSE_PY = await this.authService  // response_py es la respuesta del endpoint de fastapi, que nos devuelve el token de python
              .doLoginPython(data) //? llamada al endpoint A TRAVES DEL LOGIN PYTHON
              .toPromise(); // convertimos el observable en una promesa para usar async que usamos en la cabecera del metodo acceder

            if (RESPONSE_PY?.access_token) { // si el endpoint devuelve el token lo guardamos en localstorage (? response_py no sea null ni undefined y exista el access token)
              //? ya se puede guardar en navegador pq el token se ha verificado ya
              localStorage.setItem('token_python', RESPONSE_PY.access_token); // localstorage = almacenamiento local del navegador | access_token es el nombre del token que devuelve python
              localStorage.setItem('usuario_python', data.username);
              console.log("token válido login exitoso")
            } else {
              console.error("No se recibió token de FastAPI"); //! el backend es binario así que en principio este error no sale
            }

          } catch (error) { //! error 401
            console.error("Error obteniendo token FastAPI", error);
            this.snackBar.open('Error de autenticación en el servidor de Python', 'Cerrar', {duration: 5000});
          }

          this.router.navigate([`/${RESPONSE.data.accion}`]); // redireccion a la pantalla de inicio (esto estaba ya antes, lo dejamos igual)

        } 
        else if (RESPONSE.data.valido === 0) { // usuario no valido
          this.snackBar.open('Usuario inhabilitado', 'Cerrar', {duration: 5000});
        } 
        else if (RESPONSE.data.valido === 1) { // usuario o contraseña incorrectos
          this.snackBar.open('Usuario o contraseña incorrectas', 'Cerrar', {duration: 5000});
        }
      }
    }
  }

  forgotPassword() {
      this.valueChange.emit(true);
  }

}
