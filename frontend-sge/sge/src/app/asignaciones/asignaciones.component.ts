import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { AsignacionesService } from '../services/asignaciones.service';
import { VacantesService } from '../services/vacantes.service';

@Component({
  selector: 'app-asignaciones',
  templateUrl: './asignaciones.component.html',
  styleUrls: ['./asignaciones.component.scss']
})
export class AsignacionesComponent implements OnInit {
  @ViewChild('asigDialog') asigDialog!: TemplateRef<any>;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  dataSource = new MatTableDataSource<any>([]);
  displayedColumns: string[] = ['alumno_nombre', 'empresa_nombre', 'ciclo', 'curso', 'acciones'];

  asigForm!: FormGroup;
  alumnosLibres: any[] = [];
  vacantesDisponibles: any[] = [];

  // Filtros de cabecera
  alumnoFilter = new FormControl('');
  empresaFilter = new FormControl('');

  constructor(
    private fb: FormBuilder,
    public dialog: MatDialog,
    private asigService: AsignacionesService,
    private vacanteService: VacantesService
  ) {
    this.asigForm = this.fb.group({
      id_alumno: [null, Validators.required],
      id_vacante: [null, Validators.required]
    });
  }

  ngOnInit(): void {
    this.cargarDatos();
    this.setupFilters();
  }

  setupFilters() {
    this.alumnoFilter.valueChanges.subscribe(v => this.applyFilter());
    this.empresaFilter.valueChanges.subscribe(v => this.applyFilter());

    this.dataSource.filterPredicate = (data, filter) => {
      const search = JSON.parse(filter);
      return data.alumno_nombre.toLowerCase().includes(search.alumno) &&
        data.empresa_nombre.toLowerCase().includes(search.empresa);
    };
  }

  applyFilter() {
    this.dataSource.filter = JSON.stringify({ // Convertimos a minúsculas para una búsqueda case-insensitive
      alumno: this.alumnoFilter.value?.toLowerCase() || '', // si el filtro está vacío, usamos cadena vacía para no filtrar
      empresa: this.empresaFilter.value?.toLowerCase() || '' // lo mismo para empresa
    });
  }

  cargarDatos() {
    // 1. Tabla principal
    this.asigService.getAsignaciones().subscribe(res => {
      this.dataSource.data = res;
      this.dataSource.paginator = this.paginator;
    });

    // 2. Datos para el Pop-up
    this.asigService.getAlumnosLibres().subscribe(res => this.alumnosLibres = res);
    this.vacanteService.getVacantes().subscribe(res => {
      // Solo mostramos vacantes con hueco
      this.vacantesDisponibles = res.filter((v: any) => v.num_alumnos < v.num_vacantes);
    });
  }

  openDialog() { // Reseteamos el formulario cada vez que se abre el diálogo
    this.asigForm.reset();
    this.dialog.open(this.asigDialog, { width: '500px' });
  }

  guardarAsignacion() {
    if (this.asigForm.valid) {
      const { id_vacante, id_alumno } = this.asigForm.value;
      this.asigService.asignar(id_vacante, id_alumno).subscribe({ // suscribimos con next y error para manejar ambos casos
        next: () => {
          this.cargarDatos();
          this.dialog.closeAll(); // Cerramos el diálogo solo si la asignación fue exitosa
        },
        error: (err) => alert(err.error.detail || 'Error en la asignación')
      });
    }
  }

  eliminar(id: number) {
    if (confirm('¿Desvincular alumno de la empresa? El alumno volverá a estar disponible.')) {
      this.asigService.borrarAsignacion(id).subscribe(() => this.cargarDatos());
    }
  }
}
