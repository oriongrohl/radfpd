import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { AlumnosService } from '../services/alumnos.service';

@Component({
  selector: 'app-alumnos',
  templateUrl: './alumnos.component.html',
  styleUrls: ['./alumnos.component.scss']
})
export class AlumnosComponent implements OnInit {
  @ViewChild('alumnoDialog') alumnoDialog!: TemplateRef<any>;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  dataSource = new MatTableDataSource<any>([]);
  displayedColumns: string[] = ['nif_nie', 'nombre', 'apellidos', 'ciclo', 'curso', 'acciones'];

  alumnoForm!: FormGroup;
  ciclos: any[] = [];
  entidades: any[] = [];
  isEdit = false;
  currentId: number | null = null;

  // --- DECLARACIÓN DE FILTROS ---
  nifFilter = new FormControl('');
  nombreFilter = new FormControl('');
  apellidosFilter = new FormControl('');
  cicloFilter = new FormControl('');
  cursoFilter = new FormControl('');

  filterValues = {
    nif_nie: '',
    nombre: '',
    apellidos: '',
    ciclo_nombre: ''
  };

  constructor(
    private fb: FormBuilder,
    public dialog: MatDialog,
    private alumnosService: AlumnosService
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.cargarAlumnos();
    this.cargarCiclos();
    this.setupFilters();
    this.cargarEntidades();
  }

  // --- CONFIGURACIÓN DE FILTROS ---
  setupFilters() {
    this.nifFilter.valueChanges.subscribe(value => {
      this.filterValues.nif_nie = value?.toLowerCase() || '';
      this.dataSource.filter = JSON.stringify(this.filterValues);
    });
    this.nombreFilter.valueChanges.subscribe(value => {
      this.filterValues.nombre = value?.toLowerCase() || '';
      this.dataSource.filter = JSON.stringify(this.filterValues);
    });
    this.apellidosFilter.valueChanges.subscribe(value => {
      this.filterValues.apellidos = value?.toLowerCase() || '';
      this.dataSource.filter = JSON.stringify(this.filterValues);
    });
    this.cicloFilter.valueChanges.subscribe(value => {
      this.filterValues.ciclo_nombre = value?.toLowerCase() || '';
      this.dataSource.filter = JSON.stringify(this.filterValues);
    });

    this.dataSource.filterPredicate = (data, filter) => {
      const searchTerms = JSON.parse(filter);
      return data.nif_nie.toLowerCase().includes(searchTerms.nif_nie) &&
        data.nombre.toLowerCase().includes(searchTerms.nombre) &&
        data.apellidos.toLowerCase().includes(searchTerms.apellidos) &&
        (data.ciclo_nombre || '').toLowerCase().includes(searchTerms.ciclo_nombre);
    };
  }

  initForm() {
    this.alumnoForm = this.fb.group({
      nif_nie: ['', [Validators.required, Validators.maxLength(9)]],
      nombre: ['', Validators.required],
      apellidos: ['', Validators.required],
      id_ciclo: [null, Validators.required],
      curso: [1, Validators.required],
      id_entidad: [1],
      id_provincia: [62],
      fecha_nacimiento: ['2000-01-01', Validators.required],
      telefono: ['600000000', Validators.required],
      direccion: [''],
      localidad: ['', Validators.required],
      cp: ['', Validators.required, Validators.pattern('^[0-9]{5}$')], // validar 5 numeros desde el frontend
      observaciones: ['']
    });
  }

  cargarCiclos() {
    this.alumnosService.getCiclosTecnologia().subscribe(res => this.ciclos = res);
  }

  cargarEntidades() {
    this.alumnosService.getEntidades().subscribe(res => this.entidades = res);
  }

  cargarAlumnos() {
    this.alumnosService.getAlumnos().subscribe(res => {
      this.dataSource.data = res;
      this.dataSource.paginator = this.paginator;
    });
  }

  openDialog(alumno?: any) {
    this.isEdit = !!alumno;
    if (this.isEdit) {
      this.currentId = alumno.id_alumno;
      this.alumnoForm.patchValue(alumno);
    } else {
      this.currentId = null;
      this.alumnoForm.reset({ id_entidad: 1, id_provincia: 62, curso: 1, fecha_nacimiento: '2000-01-01', telefono: '600000000' });
    }
    this.dialog.open(this.alumnoDialog, { width: '600px' });
  }

  confirmSave() {
    if (this.alumnoForm.invalid) return;

    if (this.isEdit && this.currentId) {
      this.alumnosService.updateAlumno(this.currentId, this.alumnoForm.value).subscribe({
        next: () => {
          this.cargarAlumnos();
          this.dialog.closeAll();
        },
        error: (err) => alert("Error al editar: " + (err.error?.detail || 'Error'))
      });
    } else {
      this.alumnosService.addAlumno(this.alumnoForm.value).subscribe({
        next: () => {
          this.cargarAlumnos();
          this.dialog.closeAll();
        },
        error: (err) => alert("Error al crear: " + (err.error?.detail || 'Error'))
      });
    }
  }

  borrarAlumno(id: number) {
    if (confirm("¿Deseas eliminar el alumno?")) {
      this.alumnosService.deleteAlumno(id).subscribe(() => this.cargarAlumnos());
    }
  }
}
