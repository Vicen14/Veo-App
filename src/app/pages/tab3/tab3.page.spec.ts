import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { Tab3Page } from './tab3.page';
import { AuthService } from '../../services/auth.service';
import { DatabaseService } from '../../services/database.service';
import { APP_BASE_HREF } from '@angular/common';

describe('Tab3Page', () => {
  let component: Tab3Page;
  let fixture: ComponentFixture<Tab3Page>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let dbServiceSpy: jasmine.SpyObj<DatabaseService>;

  beforeEach(waitForAsync(() => {
    authServiceSpy = jasmine.createSpyObj('AuthService', [], {
      currentUserValue: { id: '1', email: 'test@test.com' }
    });
    dbServiceSpy = jasmine.createSpyObj('DatabaseService', ['getFavorites', 'removeFavorite']);

    TestBed.configureTestingModule({
      imports: [Tab3Page],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: DatabaseService, useValue: dbServiceSpy },
        { provide: APP_BASE_HREF, useValue: '/' }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Tab3Page);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load favorites on init', async () => {
    const mockFavorites = [{ id: 1, userId: 1, placeId: 'p1', name: 'Place 1', address: 'Addr 1', rating: 5, createdAt: new Date() }];
    dbServiceSpy.getFavorites.and.returnValue(Promise.resolve(mockFavorites));

    await component.loadFavorites();

    expect(dbServiceSpy.getFavorites).toHaveBeenCalledWith(1);
    expect(component.favorites).toEqual(mockFavorites);
  });

  it('should remove favorite and reload', async () => {
    const mockFav = { id: 1, userId: 1, placeId: 'p1', name: 'Place 1', address: 'Addr 1', rating: 5, createdAt: new Date() };
    dbServiceSpy.removeFavorite.and.returnValue(Promise.resolve());
    dbServiceSpy.getFavorites.and.returnValue(Promise.resolve([]));

    await component.removeFavorite(mockFav);

    expect(dbServiceSpy.removeFavorite).toHaveBeenCalledWith(1, 'p1');
    expect(dbServiceSpy.getFavorites).toHaveBeenCalled();
  });
});
