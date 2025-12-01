import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Preferences } from '@capacitor/preferences';
import { BehaviorSubject, Observable, from, of, throwError } from 'rxjs';
import { map, switchMap, tap, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { DatabaseService, User } from './database.service';

const TOKEN_KEY = 'my-auth-token';
const USER_KEY = 'my-auth-user';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // cambia esto por tu url real
  private apiUrl = 'https://api.example.com'; 
  
  private _isAuthenticated = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this._isAuthenticated.asObservable();

  private _currentUser = new BehaviorSubject<User | null>(null);
  public currentUser$ = this._currentUser.asObservable();

  constructor(
    private http: HttpClient, 
    private router: Router,
    private db: DatabaseService
  ) {
    this.checkAuth();
  }

  checkAuth(): void {
    Preferences.get({ key: TOKEN_KEY }).then(token => {
      if (token.value) {
        this._isAuthenticated.next(true);
        // intenta restaurar usuario desde preferencias
        Preferences.get({ key: USER_KEY }).then(user => {
          if (user.value) {
            this._currentUser.next(JSON.parse(user.value));
          }
        });
      } else {
        this._isAuthenticated.next(false);
        this._currentUser.next(null);
      }
    });
  }

  get isAuthenticated(): boolean {
    return this._isAuthenticated.value;
  }

  get currentUserValue(): User | null {
    return this._currentUser.value;
  }

  login(credentials: { email: string, password: string }): Observable<any> {
    // intentamos login local
    return from(this.db.getUserByEmail(credentials.email)).pipe(
      switchMap(user => {
        if (user && user.password === credentials.password) {
          // login exitoso localmente
          const token = 'dummy-jwt-token-' + Date.now(); // simulamos un token
          const userData: User = { id: user.id, email: user.email, name: user.name };
          
          const saveToken = Preferences.set({ key: TOKEN_KEY, value: token });
          const saveUser = Preferences.set({ key: USER_KEY, value: JSON.stringify(userData) });

          return from(Promise.all([saveToken, saveUser])).pipe(
            tap(() => {
              this._isAuthenticated.next(true);
              this._currentUser.next(userData);
            }),
            map(() => ({ token, user: userData }))
          );
        } else {
          // si no encuentra local o password incorrecto
          return throwError(() => new Error('Credenciales inválidas'));
        }
      })
    );
  }

  register(data: { email: string, password: string, name: string }): Observable<any> {
    // primero verificamos si existe localmente
    return from(this.db.getUserByEmail(data.email)).pipe(
      switchMap(existing => {
        if (existing) {
          return throwError(() => new Error('El usuario ya existe'));
        }
        // creamos usuario
        return from(this.db.createUser(data.email, data.password, data.name)).pipe(
          map(id => ({ id, ...data }))
        );
      })
    );
  }

  resetPassword(email: string, newPass: string): Observable<any> {
    return from(this.db.getUserByEmail(email)).pipe(
      switchMap(user => {
        if (!user) {
          return throwError(() => new Error('Usuario no encontrado'));
        }
        return from(this.db.updateUserPassword(email, newPass));
      })
    );
  }

  logout(): Promise<void> {
    this._isAuthenticated.next(false);
    this._currentUser.next(null);
    return Promise.all([
      Preferences.remove({ key: TOKEN_KEY }),
      Preferences.remove({ key: USER_KEY })
    ]).then(() => {
      this.router.navigate(['/login']);
    });
  }

  async getToken(): Promise<string | null> {
    const item = await Preferences.get({ key: TOKEN_KEY });
    return item.value;
  }
}
