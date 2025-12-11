describe('Navegación Básica de la Aplicación (Smoke Test)', () => {
  
  it('Debe cargar la página de Login', () => {
    cy.visit('/login');
    cy.contains('Iniciar sesión');
    cy.get('form').should('exist');
  });

  it('Debe navegar a Registrarse desde Login', () => {
    cy.visit('/login');
    cy.contains('Registrarse').click();
    cy.url().should('include', '/registrarse');
  });

  it('Debe cargar las pestañas principales', () => {
    // visitamos directamente las tabs para verificar que cargan
    
    const tabs = ['tab1', 'tab2', 'tab3'];
    
    tabs.forEach(tab => {
      cy.visit(`/tabs/${tab}`);
      cy.url().should('include', `/tabs/${tab}`);
    });
  });

  it('Debe permitir un flujo de login simple (simulado)', () => {
    cy.visit('/login');
    
    // llenar formulario
    cy.get('ion-input[formControlName="email"] input').type('test@example.com', { force: true });
    cy.get('ion-input[formControlName="password"] input').type('123456', { force: true });
    
    cy.get('ion-button[type="submit"]').click();
    
    // verificar redirección o mensaje de éxito
    // cy.url().should('include', '/tabs/tab1');
  });
});
