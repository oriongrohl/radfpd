import { Component, OnInit } from '@angular/core';
import { AlumnosService } from '../services/alumnos.service';

@Component({
  selector: 'app-alumnos',
  templateUrl: './alumnos.component.html',
  styleUrls: ['./alumnos.component.scss']
})

export class AlumnosComponent implements OnInit {
alumnos: any[] = [];

  constructor(private alumnosService: AlumnosService) { }

  ngOnInit(): void {
    this.alumnosService.getAlumnos().subscribe(
      (response: any) => {
        // Asumiendo que tu FastAPI devuelve la lista directamente
        this.alumnos = response; 
      },
      error => console.error('Error al traer alumnos:', error)
    );
  }

  

}