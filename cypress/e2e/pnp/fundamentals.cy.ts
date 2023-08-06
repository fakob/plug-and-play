/* eslint-disable prettier/prettier */
describe('fundamentals', () => {
  it('opens page', () => {
    cy.visit('http://127.0.0.1:8080');
    cy.wait(2000); // ugly, wait for graphs to arrive
    cy.get('#\\:r3\\:').click();
    cy.get('body').contains("Drawing a chart").click();
  });
  /*it('right click', () => {
    cy.get('.DwtG9OodcaM_pw_oSWFh > canvas').rightclick(); // just background
  });
  it('clear', () => {
    cy.get(':nth-child(8) > .MuiListItemIcon-root').click();
  });*/
});
