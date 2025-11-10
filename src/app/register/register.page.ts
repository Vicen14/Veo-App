import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
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

@Component({
  selector: 'app-register',
  templateUrl: 'register.page.html',
  styleUrls: ['register.page.scss'],
  imports: [CommonModule, FormsModule, RouterModule, IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonLabel, IonInput, IonButton, IonIcon],
})
export class RegisterPage {
  email: string = '';
  password: string = '';
  passwordValid: boolean = false;

  constructor() {}

  checkPassword() {
    const pwd = this.password || '';
    const re = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
    this.passwordValid = re.test(pwd);
  }

  onRegister() {
    this.checkPassword();
    if (!this.passwordValid) return;
    // Placeholder: connect to backend/auth service
    console.log('Register requested', { email: this.email });
    alert('Cuenta creada para: ' + this.email);
  }
}
