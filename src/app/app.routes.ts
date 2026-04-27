import { Routes } from '@angular/router';
import { ProbabilityPageComponent } from './features/probability/probability.page';
import { ProbabilityFunctionsPageComponent } from './features/probability-functions/probability-functions.page';
import { NormalAssignmentPageComponent } from './features/normal-assignment/normal-assignment.page';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'histograma' },
  { path: 'histograma', component: ProbabilityPageComponent },
  { path: 'funciones-probabilidad', component: ProbabilityFunctionsPageComponent },
  { path: 'distribucion-normal', component: NormalAssignmentPageComponent },
  { path: 'probability', pathMatch: 'full', redirectTo: 'funciones-probabilidad' },
  { path: '**', redirectTo: 'histograma' }
];
