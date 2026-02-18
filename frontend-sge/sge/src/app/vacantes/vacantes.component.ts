import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { VacantesService } from '../services/vacantes.service';
import { HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';

@Component({
  selector: 'app-vacantes',
  templateUrl: './vacantes.component.html',
  styleUrls: ['./vacantes.component.scss']
})

export class VacantesComponent implements OnInit {

  @ViewChild('asignacionesDialog') asignacionesDialog!: TemplateRef<any>;
  alumnosAsignados: any[] = [];
  alumnosLibres: any[] = [];
  vacanteSeleccionada: any = null;
  alumnoParaAsignar = new FormControl(null);

  @ViewChild('vacanteDialog') vacanteDialog!: TemplateRef<any>;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  dataSource = new MatTableDataSource<any>([]);
  displayedColumns: string[] = ['id_vacante', 'entidad', 'ciclo', 'curso', 'plazas', 'actions', 'asignaciones'];

  // Filtros
  idFilter = new FormControl('');
  entidadFilter = new FormControl('');
  cicloFilter = new FormControl('');
  cursoFilter = new FormControl('');

  vacanteForm!: FormGroup;
  entidades: any[] = [];
  ciclos: any[] = [];
  isEdit = false;
  currentId: number | null = null;
  numAlumnosActuales = 0; // Para validar que no bajen plazas de más

  constructor(
    private fb: FormBuilder,
    private dialog: MatDialog,
    private vacanteService: VacantesService,
    private http: HttpClient
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.cargarDatosMaestros();
    this.listar();
    // this.cargarCiclos();
  }
  // cargarCiclos() {
  //   this.vacanteService.getCiclos().subscribe(res => {
  //     this.ciclos = res;
  //     console.log("Ciclos cargados:", res); // Mira la consola (F12) para ver si llegan datos
  //   });
  // }
  cargarEntidades() {
    this.http.get<any[]>('http://127.0.0.1:8000/entidades').subscribe(res => this.entidades = res);
  }

  initForm() {
    this.vacanteForm = this.fb.group({
      id_entidad: [null, Validators.required],
      id_ciclos: [null, Validators.required],
      curso: [1, Validators.required],
      num_vacantes: [1, [Validators.required, Validators.min(1)]],
      observaciones: ['']
    });
  }

  cargarDatosMaestros() {
    this.http.get<any[]>('http://127.0.0.1:8000/entidades').subscribe(res => this.entidades = res);
    this.http.get<any[]>('http://127.0.0.1:8000/ciclos').subscribe(res => this.ciclos = res);
  }

  listar() {
    this.vacanteService.getVacantes().subscribe(res => {
      this.dataSource.data = res;
      this.dataSource.paginator = this.paginator;
    });
  }

  openDialog(vacante?: any) { // abre el pop up de edicion
    this.isEdit = !!vacante;
    if (this.isEdit) {
      this.currentId = vacante.id_vacante;
      this.numAlumnosActuales = vacante.num_alumnos;

      // mapeo de los valores del backend al formulario
      this.vacanteForm.patchValue({
        id_entidad: vacante.id_entidad,
        id_ciclos: vacante.id_ciclos,
        curso: vacante.curso,
        num_vacantes: vacante.num_vacantes,
        observaciones: vacante.observaciones || ''
      });
    } else {
      this.currentId = null;
      this.numAlumnosActuales = 0;
      this.vacanteForm.reset({ curso: 1, num_vacantes: 1 });
    }
    this.dialog.open(this.vacanteDialog, { width: '500px' });
  }

  confirmSave() {
  const datos = this.vacanteForm.value;

  if (this.isEdit && this.currentId) {
    // Validación solo de plazas
    if (datos.num_vacantes < this.numAlumnosActuales) {
      alert(`No puedes reducir a ${datos.num_vacantes} plazas. Hay ${this.numAlumnosActuales} alumnos asignados.`);
      return;
    }

    this.vacanteService.actualizarVacante(this.currentId, datos).subscribe({
      next: () => {
        console.log("Vacante actualizada:", datos);
        this.finalizarGuardado();
      },
      error: (err) => {
        console.error(" Error:", err);
        alert("Error: " + (err.error?.detail || "No se pudo actualizar"));
      }
    });
  } else {
    this.vacanteService.crearVacante(datos).subscribe({
      next: () => {
        console.log("Vacante creada:", datos);
        this.finalizarGuardado();
      },
      error: (err) => {
        console.error("  Error:", err);
        alert("Error: " + (err.error?.detail || "No se pudo crear"));
      }
    });
  }
}

  finalizarGuardado() {
    this.listar();
    this.closeDialog();
  }

  deleteVacante(v: any) {
    if (v.num_alumnos > 0) {
      alert('No se puede borrar una vacante con alumnos asignados.');
      return;
    }
    if (confirm('¿Borrar vacante?')) {
      this.vacanteService.borrarVacante(v.id_vacante).subscribe(() => this.listar());
    }
  }

  closeDialog() {
    this.dialog.closeAll();
  }

  openAsignacionesDialog(vacante: any) {
    this.vacanteSeleccionada = vacante;
    this.alumnoParaAsignar.reset();
    this.cargarAsignacionesYLibres();
    this.dialog.open(this.asignacionesDialog, { width: '600px' });
  }

  cargarAsignacionesYLibres() {
    const idV = this.vacanteSeleccionada.id_vacante;

    // 1. Aprovechamos GET /asignaciones y filtramos por vacante
    this.vacanteService.getAsignaciones().subscribe(res => {
      // Filtramos solo las que pertenecen a ESTA vacante
      this.alumnosAsignados = res.filter(a => a.id_vacante === idV);
    });
    
    // 2. Cargamos alumnos libres (aprovechando tu endpoint /alumnos-libres)
    this.vacanteService.getAlumnosLibres().subscribe(res => {
      // Además filtramos para que el alumno sea del mismo ciclo y curso que la vacante
      this.alumnosLibres = res.filter(al => 
        al.id_ciclo === this.vacanteSeleccionada.id_ciclos && 
        al.curso === this.vacanteSeleccionada.curso
      );
    });
  }

  // El método desvincular ahora usa el ID de la asignación (id_vacante_x_alumno)
  desvincular(idAsig: number) {
    if (confirm("¿Desvincular a este alumno?")) {
      this.vacanteService.borrarAsignacion(idAsig).subscribe({
        next: () => {
          this.cargarAsignacionesYLibres(); // Recargamos el pop-up
          this.listar(); // Recargamos la tabla principal para actualizar el contador
        }
      });
    }
  }

  asignarAlumno() {
    const idAlumno = this.alumnoParaAsignar.value;
    if (!idAlumno) return;

    this.vacanteService.asignarAlumno(this.vacanteSeleccionada.id_vacante, idAlumno).subscribe({
      next: () => {
        this.cargarAsignacionesYLibres(); // Recargar listas
        this.listar(); // Actualizar tabla principal (contador de plazas)
      },
      error: (err) => alert(err.error?.detail || "Error al asignar")
    });
  }

  

}
