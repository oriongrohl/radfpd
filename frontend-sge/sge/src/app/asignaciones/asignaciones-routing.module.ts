import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AsignacionesComponent } from './asignaciones.component';


const routes: Routes = [{ path: '', component: AsignacionesComponent }];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class AsignacionesRoutingModule { }
