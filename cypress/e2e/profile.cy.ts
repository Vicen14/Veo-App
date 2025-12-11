describe('Perfil de Usuario', () => {
  beforeEach(() => {
    cy.visit('/tabs/perfil');
  });

  it('Debe mostrar la página de perfil', () => {
    cy.contains('Perfil');
  });

  it('Debe mostrar estado de Invitado si no hay sesión', () => {
    // Asumiendo que no hemos hecho login en este test runner session
    cy.contains('Invitado').should('exist');
    cy.contains('Inicia sesión para ver tus datos').should('exist');
    
    cy.contains('Iniciar sesión').should('exist');
    cy.contains('Registrarse').should('exist');
  });

  it('Debe navegar al login desde el perfil de invitado', () => {
    cy.contains('Iniciar sesión').click();
    cy.url().should('include', '/login');
  });
});
