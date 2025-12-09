import { Component } from '@angular/core';
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
  IonToast,
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: 'login.page.html',
  styleUrls: ['login.page.scss'],
  imports: [CommonModule, ReactiveFormsModule, RouterModule, IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonLabel, IonInput, IonButton, IonIcon, IonToast],
})
export class LoginPage {
  loginForm: FormGroup;
  isToastOpen = false;
  toastMessage = '';

  constructor(
    private auth: AuthService, 
    private router: Router,
    private fb: FormBuilder
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onLogin() {
    if (!this.loginForm.valid) {
      this.toastMessage = 'Completa el formulario correctamente.';
      this.isToastOpen = true;
      return;
    }
    const { email, password } = this.loginForm.value;
    this.auth.login({ email, password }).subscribe({
      next: () => this.router.navigate(['/tabs/tab1'], { replaceUrl: true }),
      error: () => {
        this.toastMessage = 'Credenciales inválidas.';
        this.isToastOpen = true;
      }
    });
  }

  setOpen(isOpen: boolean) {
    this.isToastOpen = isOpen;
  }
}
