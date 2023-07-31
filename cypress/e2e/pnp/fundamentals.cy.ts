describe('fundamentals', () => {
  it('opens page', () => {
    cy.visit('http://localhost:8080');
    cy.wait(2000); // ugly, should not have to wait
  });
  /*it('right click', () => {
    cy.get('.DwtG9OodcaM_pw_oSWFh > canvas').rightclick(); // just background
  });
  it('clear', () => {
    cy.get(':nth-child(8) > .MuiListItemIcon-root').click();
  });*/
});
