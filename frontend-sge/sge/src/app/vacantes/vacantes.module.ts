import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { VacantesRoutingModule } from './vacantes-routing.module';
import { VacantesComponent } from './vacantes.component';


@NgModule({
  declarations: [VacantesComponent],
  imports: [
    CommonModule,
    VacantesRoutingModule
  ]
})
export class VacantesModule { }
