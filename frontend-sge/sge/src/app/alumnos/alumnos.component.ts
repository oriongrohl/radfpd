import { Component, OnInit } from '@angular/core';
import { AlumnosService } from '../services/alumnos.service';
import { AlumnoInterface } from '../shared/interfaces/alumno';

@Component({
  selector: 'app-alumnos',
  templateUrl: './alumnos.component.html',
  styleUrls: ['./alumnos.component.scss']
})


export class AlumnosComponent implements OnInit {
  alumnos: any[] = [];
  ciclos: any[] = []; // Para el desplegable

  constructor(private alumnosService: AlumnosService) { }

  ngOnInit(): void {
    this.cargarAlumnos();
    this.cargarCiclos(); // Cargamos los ciclos al iniciar
  }

  cargarCiclos() {
    this.alumnosService.getCiclosTecnologia().subscribe(
      res => this.ciclos = res,
      err => console.error(err)
    );
  }

  cargarAlumnos() {
    this.alumnosService.getAlumnos().subscribe(
      (response: any) => this.alumnos = response,
      error => console.error('Error al traer alumnos:', error)
    );
  }

  borrarAlumno(id: number) {
    if(confirm("¿Deseas eliminar el alumno?")) {
      this.alumnosService.deleteAlumno(id).subscribe(() => {
        this.cargarAlumnos(); // Refrescar lista tras borrar
      });
    }
  }

  // Mejoramos la firma para incluir el ciclo seleccionado
  agregarAlumno(nombre: string, apellidos: string, nif: string, idCiclo: string) {
    const nuevoAlumno: AlumnoInterface = {
      nombre: nombre,
      apellidos: apellidos,
      nif_nie: nif,
      id_entidad: 1, // El backend lo fuerza, pero lo enviamos por coherencia
      id_ciclo: parseInt(idCiclo),
      curso: 1,
      id_provincia: 62, // ej malaga
      fecha_nacimiento: "2000-01-01",
      telefono: "600000000",
    };

    this.alumnosService.addAlumno(nuevoAlumno).subscribe({
      next: () => {
        this.cargarAlumnos(); // Refrescar lista
        alert("Alumno añadido");
      },
      error: (err) => alert("Error: " + err.error.detail)
    });
  }
}
