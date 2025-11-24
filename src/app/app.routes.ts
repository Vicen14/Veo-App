import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'registrarse',
    loadComponent: () => import('./pages/registrarse/registrarse.page').then((m) => m.RegistrarsePage),
  },
  {
    path: 'olvidaste-tu-contraseña',
    loadComponent: () => import('./pages/olvidaste-tu-contraseña/olvidaste-tu-contraseña.page').then((m) => m.OlvidasteTuContrasenaPage),
  },
  {
    path: '',
    loadChildren: () => import('./pages/tabs/tabs.routes').then((m) => m.routes),
  },
];
