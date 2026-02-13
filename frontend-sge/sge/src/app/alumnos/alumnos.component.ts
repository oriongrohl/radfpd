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

  

  constructor(private alumnosService: AlumnosService) { }

  ngOnInit(): void {
    this.cargarAlumnos()
  }

  cargarAlumnos() {
    this.alumnosService.getAlumnos().subscribe(
      (response: any) => {
        // Asumiendo que tu FastAPI devuelve la lista directamente
        this.alumnos = response; 
      },
      error => console.error('Error al traer alumnos:', error)
    );
  }

  borrarAlumno(id: number) {
    if(confirm("Deseo eliminar el alumno")){
      this.alumnosService.deleteAlumno(id).subscribe()
    }
  }

  agregarAlumno(nombre: string, apellidos: string, nif_nie: string ) {
    let nuevoAlumno: AlumnoInterface = {
      nombre: nombre,
      apellidos: apellidos,
      nif_nie: nif_nie,
      id_entidad: 1, // valores por defecto para pruebas
      id_ciclo: 1,
      curso: 1,
      id_provincia: 1,
      id_alumno: undefined,
      fecha_nacimiento: undefined,
      telefono: 0,
      direccion: '',
      cp: '',
      localidad: '',
      observaciones: ''
    };
    this.alumnosService.addAlumno(nuevoAlumno).subscribe()
  }



}