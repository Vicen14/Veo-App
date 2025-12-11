import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { LoginPage } from './login.page';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { APP_BASE_HREF } from '@angular/common';

describe('LoginPage', () => {
  let component: LoginPage;
  let fixture: ComponentFixture<LoginPage>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(waitForAsync(() => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['login']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      imports: [LoginPage, ReactiveFormsModule],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: APP_BASE_HREF, useValue: '/' }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have invalid form initially', () => {
    expect(component.loginForm.valid).toBeFalse();
  });

  it('should call auth.login and navigate on valid submission', () => {
    component.loginForm.setValue({ email: 'test@test.com', password: 'password123' });
    authServiceSpy.login.and.returnValue(of({ id: '1', email: 'test@test.com', name: 'Test' }));

    component.onLogin();

    expect(authServiceSpy.login).toHaveBeenCalledWith({ email: 'test@test.com', password: 'password123' });
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/tabs/tab1'], { replaceUrl: true });
  });

  it('should show toast on login error', () => {
    component.loginForm.setValue({ email: 'test@test.com', password: 'wrongpassword' });
    authServiceSpy.login.and.returnValue(throwError(() => new Error('Invalid credentials')));

    component.onLogin();

    expect(component.isToastOpen).toBeTrue();
    expect(component.toastMessage).toBe('Credenciales inválidas.');
  });
});
