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
} from '@ionic/angular/standalone';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-registrarse',
  templateUrl: 'registrarse.page.html',
  styleUrls: ['registrarse.page.scss'],
  imports: [CommonModule, FormsModule, RouterModule, IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonLabel, IonInput, IonButton, IonIcon],
})
export class RegistrarsePage {
  email: string = '';
  password: string = '';
  name: string = '';
  passwordValid: boolean = false;

  constructor(private auth: AuthService, private router: Router) {}

  checkPassword() {
    const pwd = this.password || '';
    const re = /^(?=.*[A-Z])(?=.*\d).{8,20}$/;
    this.passwordValid = re.test(pwd);
  }

  async onRegister() {
    this.checkPassword();
    if (!this.passwordValid || !this.email) return;
    
    try {
      this.auth.register({ email: this.email, password: this.password, name: this.name || 'Usuario' }).subscribe({
        next: () => {
          this.auth.login({ email: this.email, password: this.password }).subscribe({
            next: () => {
              this.router.navigate(['/tabs/tab1']);
            },
            error: () => {
              this.router.navigate(['/login']);
            }
          });
        },
        error: (err) => {
          console.error('Error de registro:', err);
          alert('Error: ' + (err.message || JSON.stringify(err)));
        }
      });
    } catch (e: any) {
      console.error('Error de registro en la página:', e);
      alert('Error inesperado: ' + (e.message || e));
    }
  }
}
