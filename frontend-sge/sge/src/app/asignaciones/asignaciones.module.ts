import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AsignacionesComponent } from './asignaciones.component';
import { AsignacionesRoutingModule } from './asignaciones-routing.module';
import { ReactiveFormsModule, FormsModule } from '@angular/forms'; // Para [formControl] e [ngModel]
import { MatTableModule } from '@angular/material/table';         // Para [dataSource]
import { MatInputModule } from '@angular/material/input';         // Para matInput
import { MatFormFieldModule } from '@angular/material/form-field'; // Para mat-form-field
import { MatDialogModule } from '@angular/material/dialog';       // Para el Pop-up
import { MatSelectModule } from '@angular/material/select';       // Para mat-select
import { MatIconModule } from '@angular/material/icon';           // Para mat-icon
import { MatButtonModule } from '@angular/material/button';       // Para mat-button
import { MatPaginatorModule } from '@angular/material/paginator'; // Para el paginador

@NgModule({
    declarations: [AsignacionesComponent],
    imports: [
    CommonModule,
    AsignacionesRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    FormsModule,
    MatTableModule,
    MatInputModule,
    MatFormFieldModule,
    MatDialogModule,
    MatSelectModule,
    MatIconModule,
    MatButtonModule,
    MatPaginatorModule
    ]
})
export class AsignacionesModule { }
