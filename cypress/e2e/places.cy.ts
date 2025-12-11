describe('Gestión de Lugares (Tab 2)', () => {
  beforeEach(() => {
    cy.visit('/tabs/tab2');
  });

  it('Debe mostrar el título y formulario vacío', () => {
    cy.contains('Mis lugares');
    cy.contains('Agregar Lugar');
    cy.get('input[name="venueName"]').should('have.value', '');
  });

  it('Debe permitir agregar un nuevo lugar', () => {
    const placeName = 'Lugar de Prueba E2E';
    
    // Llenar nombre
    cy.get('input[name="venueName"]').type(placeName);
    
    // Seleccionar tipo (Manejo de modal personalizado)
    cy.get('.custom-select').click();
    cy.get('ion-modal').should('be.visible');
    // Seleccionar el primer item de la lista en el modal
    cy.get('ion-modal ion-item').first().click();
    cy.get('ion-modal').should('not.be.visible'); // Esperar a que cierre

    // Llenar descripción
    cy.get('textarea[name="venueDescription"]').type('Descripción generada por Cypress');

    // Guardar
    cy.contains('Guardar lugar').click();

    // Verificar que aparece en la lista
    cy.contains(placeName).should('exist');
  });

  it('Debe permitir editar un lugar existente', () => {
    // Asumiendo que ya hay un lugar o creamos uno primero
    // Para asegurar, creamos uno rápido
    const placeName = 'Lugar para Editar';
    cy.get('input[name="venueName"]').type(placeName);
    cy.get('.custom-select').click();
    cy.get('ion-modal ion-item').first().click();
    cy.contains('Guardar lugar').click();

    // Buscar el botón de editar del lugar creado
    cy.contains(placeName)
      .parents('.place-card')
      .find('ion-button[color="primary"]') // Botón de editar
      .click();

    // Verificar que el formulario cambió a modo edición
    cy.contains('Editar Lugar');
    cy.get('input[name="venueName"]').should('have.value', placeName);

    // Cambiar nombre
    cy.get('input[name="venueName"]').clear().type(placeName + ' Editado');
    cy.contains('Actualizar lugar').click();

    // Verificar cambio
    cy.contains(placeName + ' Editado').should('exist');
  });

  it('Debe permitir eliminar un lugar', () => {
    const placeName = 'Lugar para Eliminar';
    cy.get('input[name="venueName"]').type(placeName);
    cy.get('.custom-select').click();
    cy.get('ion-modal ion-item').first().click();
    cy.contains('Guardar lugar').click();

    cy.contains(placeName)
      .parents('.place-card')
      .find('ion-button[color="danger"]') // Botón de eliminar
      .click();

    // Confirmar alerta si existe (Ionic suele usar ion-alert)
    // Si usas window.confirm o ion-alert, cypress puede necesitar manejo especial
    // Si es borrado directo:
    cy.contains(placeName).should('not.exist');
  });
});
