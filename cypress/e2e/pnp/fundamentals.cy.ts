/* eslint-disable prettier/prettier */
describe('fundamentals', () => {
  it('Open main page', () => {
    cy.visit('http://127.0.0.1:8080');
    cy.get('#\\:r3\\:').click();
  });
  it('Clear', () => {
    cy.visit('http://127.0.0.1:8080');
    cy.wait(2000);
    cy.get('body').type("§clear§")
  });

});
