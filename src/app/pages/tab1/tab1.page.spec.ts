import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { APP_BASE_HREF } from '@angular/common';
import { Tab1Page } from './tab1.page';
import { AuthService } from '../../services/auth.service';
import { DatabaseService } from '../../services/database.service';
import { GeolocationService } from '../../services/geolocation.service';
import { ApiService } from '../../services/api.service';
import { of } from 'rxjs';

describe('Tab1Page', () => {
  let component: Tab1Page;
  let fixture: ComponentFixture<Tab1Page>;
  
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let dbServiceSpy: jasmine.SpyObj<DatabaseService>;
  let geoServiceSpy: jasmine.SpyObj<GeolocationService>;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  beforeEach(waitForAsync(() => {
    // mock de servicios
    authServiceSpy = jasmine.createSpyObj('AuthService', [], {
      currentUser$: of({ id: 'test-user' })
    });
    dbServiceSpy = jasmine.createSpyObj('DatabaseService', ['getVenues']);
    geoServiceSpy = jasmine.createSpyObj('GeolocationService', ['getCurrentPosition']);
    apiServiceSpy = jasmine.createSpyObj('ApiService', ['getPlaces']);

    // mock del objeto global google
    (window as any).google = {
      maps: {
        Map: class {
            setCenter() {}
            setZoom() {}
        },
        InfoWindow: class {
            setContent() {}
            open() {}
            close() {}
        },
        Marker: class {
            setMap() {}
            addListener() {}
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
      imports: [Tab1Page],
      providers: [
        { provide: APP_BASE_HREF, useValue: '/' },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: DatabaseService, useValue: dbServiceSpy },
        { provide: GeolocationService, useValue: geoServiceSpy },
        { provide: ApiService, useValue: apiServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Tab1Page);
    component = fixture.componentInstance;
    
    // mock del loader para evitar peticiones de red y errores
    // dado que no podemos mockear fácilmente la importación, podemos intentar espiar ngafterviewinit
    // o simplemente dejar que falle si lo hace. 
    // sin embargo, para hacerlo robusto, podemos intentar anular el método si es necesario.
    // por ahora, asumamos que el entorno de prueba podría no ejecutar la lógica del loader completamente 
    // o podemos mockear la clase loader si estuviera disponible globalmente.
    // pero es importada. 
    
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default selected category as "all"', () => {
    expect(component.selectedCategory).toBe('all');
  });

  it('should have empty results initially', () => {
    expect(component.results).toEqual([]);
  });
});
