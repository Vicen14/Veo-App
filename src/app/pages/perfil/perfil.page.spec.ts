import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { PerfilPage } from './perfil.page';
import { AuthService } from '../../services/auth.service';
import { of } from 'rxjs';
import { APP_BASE_HREF } from '@angular/common';

describe('PerfilPage', () => {
  let component: PerfilPage;
  let fixture: ComponentFixture<PerfilPage>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  beforeEach(waitForAsync(() => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['logout'], {
      currentUser$: of({ id: '1', email: 'test@test.com', name: 'Test User' })
    });

    TestBed.configureTestingModule({
      imports: [PerfilPage],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: APP_BASE_HREF, useValue: '/' }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PerfilPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call logout', () => {
    component.logout();
    expect(authServiceSpy.logout).toHaveBeenCalled();
  });
});
