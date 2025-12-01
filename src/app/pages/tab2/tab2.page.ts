import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  IonButton,
  IonSpinner,
  IonText,
  IonIcon,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { timeOutline, folderOpenOutline } from 'ionicons/icons';
import { DatabaseService, Venue } from '../../services/database.service';

interface VenueForm {
  name: string;
  description: string;
}

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonInput,
    IonTextarea,
    IonButton,
    IonSpinner,
    IonText,
    IonIcon,
  ]
})
export class Tab2Page implements OnInit {
  venues: Venue[] = [];
  loading = true;
  saving = false;
  errorMessage?: string;
  form: VenueForm = { name: '', description: '' };

  constructor(private readonly database: DatabaseService) {
    addIcons({ timeOutline, folderOpenOutline });
  }

  async ngOnInit(): Promise<void> {
    await this.loadVenues(true);
  }

  async onSubmit(): Promise<void> {
    const name = this.form.name.trim();
    const description = this.form.description.trim();
    if (!name) {
      this.errorMessage = 'Por favor ingresa un nombre.';
      return;
    }

    this.errorMessage = undefined;
    this.saving = true;
    try {
      await this.database.addVenue(name, description);
      this.form = { name: '', description: '' };
      await this.loadVenues();
    } catch (error: unknown) {
      this.errorMessage = this.stringifyError(error);
    } finally {
      this.saving = false;
    }
  }

  async onClear(): Promise<void> {
    this.errorMessage = undefined;
    try {
      await this.database.clearVenues();
      await this.loadVenues();
    } catch (error: unknown) {
      this.errorMessage = this.stringifyError(error);
    }
  }

  private async loadVenues(initial = false): Promise<void> {
    if (initial) {
      this.loading = true;
    }
    this.errorMessage = undefined;
    try {
      await this.database.initialize();
      this.venues = await this.database.getVenues();
    } catch (error: unknown) {
      this.errorMessage = this.stringifyError(error);
    } finally {
      if (initial) {
        this.loading = false;
      }
    }
  }



  private stringifyError(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    return 'Ocurrió un error inesperado.';
  }
}
