import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonContent,
  IonIcon,
  IonButton,
} from '@ionic/angular/standalone';
import { AuthService } from '../../services/auth.service';
import { DatabaseService, Favorite } from '../../services/database.service';
import { addIcons } from 'ionicons';
import { trashOutline, star, heartDislikeOutline } from 'ionicons/icons';

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss'],
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonContent,
    IonIcon,
    IonButton,
  ],
})
export class Tab3Page implements OnInit {
  favorites: Favorite[] = [];
  fallbackImg = 'assets/icon/icon.png';

  constructor(private auth: AuthService, private db: DatabaseService) {
    addIcons({ trashOutline, star, heartDislikeOutline });
  }

  ngOnInit() {
    this.loadFavorites();
  }

  ionViewWillEnter() {
    this.loadFavorites();
  }

  async loadFavorites() {
    const user = this.auth.currentUserValue;
    if (user) {
      this.favorites = await this.db.getFavorites(user.id);
    } else {
      this.favorites = [];
    }
  }

  async removeFavorite(fav: Favorite) {
    const user = this.auth.currentUserValue;
    if (user) {
      await this.db.removeFavorite(user.id, fav.placeId);
      this.loadFavorites();
    }
  }
}
