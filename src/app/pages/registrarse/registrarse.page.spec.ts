import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { RegistrarsePage } from './registrarse.page';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { of } from 'rxjs';
import { APP_BASE_HREF } from '@angular/common';

describe('RegistrarsePage', () => {
  let component: RegistrarsePage;
  let fixture: ComponentFixture<RegistrarsePage>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(waitForAsync(() => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['register', 'login']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      imports: [RegistrarsePage, FormsModule],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: APP_BASE_HREF, useValue: '/' }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RegistrarsePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should validate password correctly', () => {
    component.password = 'weak';
    component.checkPassword();
    expect(component.passwordValid).toBeFalse();

    component.password = 'StrongPass1';
    component.checkPassword();
    expect(component.passwordValid).toBeTrue();
  });

  it('should register and login on success', () => {
    component.email = 'new@test.com';
    component.password = 'StrongPass1';
    component.name = 'New User';
    
    authServiceSpy.register.and.returnValue(of({ id: '1', email: 'new@test.com', name: 'New User' }));
    authServiceSpy.login.and.returnValue(of({ id: '1', email: 'new@test.com', name: 'New User' }));

    component.onRegister();

    expect(authServiceSpy.register).toHaveBeenCalled();
    expect(authServiceSpy.login).toHaveBeenCalled();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/tabs/tab1']);
  });
});
