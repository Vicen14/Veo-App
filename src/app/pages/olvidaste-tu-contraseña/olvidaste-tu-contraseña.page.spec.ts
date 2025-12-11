import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { OlvidasteTuContrasenaPage } from './olvidaste-tu-contraseña.page';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { of } from 'rxjs';
import { APP_BASE_HREF } from '@angular/common';

describe('OlvidasteTuContrasenaPage', () => {
  let component: OlvidasteTuContrasenaPage;
  let fixture: ComponentFixture<OlvidasteTuContrasenaPage>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(waitForAsync(() => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['resetPassword']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      imports: [OlvidasteTuContrasenaPage, FormsModule],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: APP_BASE_HREF, useValue: '/' }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(OlvidasteTuContrasenaPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should switch to password step on verifyEmail', () => {
    component.email = 'test@test.com';
    component.verifyEmail();
    expect(component.step).toBe('password');
  });

  it('should reset password and navigate on success', () => {
    component.email = 'test@test.com';
    component.newPassword = 'StrongPass1';
    
    authServiceSpy.resetPassword.and.returnValue(of(undefined));
    spyOn(window, 'alert'); // Mock alert

    component.onReset();

    expect(authServiceSpy.resetPassword).toHaveBeenCalledWith('test@test.com', 'StrongPass1');
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });
});
