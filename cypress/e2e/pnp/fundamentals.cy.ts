/* eslint-disable prettier/prettier */
describe('fundamentals', () => {
  it('Open "Drawing a chart" - graph', () => {
    cy.visit('http://127.0.0.1:8080');
    cy.wait(2000); // ugly, wait for graphs to arrive
    cy.get('#\\:r3\\:').click();
    cy.get('body').contains("Drawing a chart").click();
  });

});
