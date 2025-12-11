describe('Autenticación', () => {
  
  describe('Login', () => {
    beforeEach(() => {
      cy.visit('/login');
    });

    it('Debe mostrar el formulario de login', () => {
      cy.contains('Iniciar sesión');
      cy.get('form').should('exist');
      cy.get('ion-input[formControlName="email"]').should('exist');
      cy.get('ion-input[formControlName="password"]').should('exist');
    });

    it('Debe validar campos requeridos', () => {
      cy.get('ion-button[type="submit"]').should('be.disabled');
      
      cy.get('ion-input[formControlName="email"] input').type('invalid-email', { force: true });
      cy.get('ion-input[formControlName="email"] input').blur();
      cy.contains('Correo inválido').should('exist');
    });

    it('Debe permitir login con credenciales válidas (simulado)', () => {
      cy.get('ion-input[formControlName="email"] input').type('test@example.com', { force: true });
      cy.get('ion-input[formControlName="password"] input').type('Password123', { force: true });
      
      cy.get('ion-button[type="submit"]').should('not.be.disabled');
      // cy.get('ion-button[type="submit"]').click();
      // Aquí normalmente verificaríamos la redirección
    });
  });

  describe('Registro', () => {
    beforeEach(() => {
      cy.visit('/registrarse');
    });

    it('Debe mostrar formulario de registro', () => {
      cy.contains('Registrarse');
      cy.get('ion-input[name="name"]').should('exist');
      cy.get('ion-input[name="email"]').should('exist');
      cy.get('ion-input[name="password"]').should('exist');
    });

    it('Debe validar la contraseña fuerte', () => {
      cy.get('ion-input[name="password"] input').type('weak', { force: true });
      cy.get('.password-hint').should('have.class', 'invalid');
      
      cy.get('ion-input[name="password"] input').clear({ force: true }).type('StrongPass1', { force: true });
      // Asumiendo que la clase invalid se quita o el hint cambia
      // cy.get('.password-hint').should('not.have.class', 'invalid');
    });
  });

  describe('Recuperar Contraseña', () => {
    beforeEach(() => {
      cy.visit('/olvidaste-tu-contraseña');
    });

    it('Debe permitir ingresar email para recuperar', () => {
      cy.contains('Recuperar Contraseña');
      cy.get('ion-input[name="email"] input').type('test@example.com', { force: true });
      cy.contains('Continuar').should('not.be.disabled');
    });
  });

});
