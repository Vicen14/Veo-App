describe('Favoritos (Tab 3)', () => {
  beforeEach(() => {
    cy.visit('/tabs/tab3');
  });

  it('Debe mostrar el título Favoritos', () => {
    cy.contains('Favoritos');
  });

  it('Debe mostrar estado vacío inicialmente', () => {
    // Asumiendo que empezamos sin favoritos
    cy.contains('No tienes lugares favoritos guardados').should('exist');
  });

  // Nota: Para probar agregar favoritos, necesitaríamos interactuar con Tab1 o Tab2
  // donde se agregan a favoritos, y luego venir aquí.
  // Eso sería un test de integración más complejo.
});
