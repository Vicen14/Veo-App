import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonIcon,
  IonText,
} from '@ionic/angular/standalone';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-olvidaste-tu-contraseña',
  templateUrl: 'olvidaste-tu-contraseña.page.html',
  styleUrls: ['olvidaste-tu-contraseña.page.scss'],
  imports: [CommonModule, FormsModule, RouterModule, IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonLabel, IonInput, IonButton, IonText],
})
export class OlvidasteTuContrasenaPage {
  email: string = '';
  newPassword: string = '';
  step: 'email' | 'password' = 'email';
  passwordValid: boolean = false;

  constructor(private auth: AuthService, private router: Router) {}

  checkPassword() {
    const pwd = this.newPassword || '';
    // Min 8, Max 20, 1 Uppercase, 1 Number
    const re = /^(?=.*[A-Z])(?=.*\d).{8,20}$/;
    this.passwordValid = re.test(pwd);
  }

  async verifyEmail() {
    if (!this.email) return;
    this.step = 'password';
  }

  async onReset() {
    this.checkPassword();
    if (!this.passwordValid || !this.email) return;

    this.auth.resetPassword(this.email, this.newPassword).subscribe({
      next: () => {
        alert('Contraseña actualizada correctamente.');
        this.router.navigate(['/login']);
      },
      error: () => {
        alert('No se encontró una cuenta con ese correo electrónico o hubo un error.');
        this.step = 'email';
      }
    });
  }
}
