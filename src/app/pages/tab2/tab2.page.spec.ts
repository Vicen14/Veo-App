import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { Tab2Page } from './tab2.page';
import { DatabaseService } from '../../services/database.service';
import { AuthService } from '../../services/auth.service';
import { of } from 'rxjs';
import { APP_BASE_HREF } from '@angular/common';

describe('Tab2Page', () => {
  let component: Tab2Page;
  let fixture: ComponentFixture<Tab2Page>;
  let dbServiceSpy: jasmine.SpyObj<DatabaseService>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  beforeEach(waitForAsync(() => {
    dbServiceSpy = jasmine.createSpyObj('DatabaseService', ['getVenues', 'addVenue', 'updateVenue', 'deleteVenue']);
    authServiceSpy = jasmine.createSpyObj('AuthService', [], {
      currentUser$: of({ id: '1', email: 'test@test.com' })
    });

    // Mock global google object
    (window as any).google = {
      maps: {
        Map: class {
            setCenter() {}
            setZoom() {}
        },
        Marker: class {
            setMap() {}
            addListener() {}
        },
        Geocoder: class {
            geocode() {}
        },
        places: {
            Autocomplete: class {
                addListener() {}
                getPlace() { return {}; }
            }
        },
        SymbolPath: {
            CIRCLE: 0
        },
        LatLng: class {},
        Animation: {
            DROP: 1
        }
      }
    };

    TestBed.configureTestingModule({
      imports: [Tab2Page],
      providers: [
        { provide: DatabaseService, useValue: dbServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: APP_BASE_HREF, useValue: '/' }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Tab2Page);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with empty form', () => {
    expect(component.form).toEqual({ name: '', description: '', address: '', type: '' });
  });
});
