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
  @ViewChild('vacanteDialog') vacanteDialog!: TemplateRef<any>;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  dataSource = new MatTableDataSource<any>([]);
  displayedColumns: string[] = ['id_vacante', 'entidad', 'ciclo', 'curso', 'plazas', 'actions'];
  
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
    this.http.get<any[]>('http://127.0.0.1:8000/ciclos.php').subscribe(res => this.ciclos = res);
  }

  listar() {
    this.vacanteService.getVacantes().subscribe(res => {
      this.dataSource.data = res;
      this.dataSource.paginator = this.paginator;
    });
  }

  openDialog(vacante?: any) {
    this.isEdit = !!vacante;
    if (this.isEdit) {
      this.currentId = vacante.id_vacante;
      this.numAlumnosActuales = vacante.num_alumnos;
      this.vacanteForm.patchValue(vacante);
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
      // Validación: No permitir bajar plazas por debajo de los alumnos ya asignados
      if (datos.num_vacantes < this.numAlumnosActuales) {
        alert(`No puedes reducir a ${datos.num_vacantes} plazas. Hay ${this.numAlumnosActuales} alumnos asignados.`);
        return;
      }
      this.vacanteService.actualizarVacante(this.currentId, datos.num_vacantes).subscribe(() => this.finalizarGuardado());
    } else {
      this.vacanteService.crearVacante(datos).subscribe(() => this.finalizarGuardado());
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
}