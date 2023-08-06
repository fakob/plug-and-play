/* eslint-disable prettier/prettier */
import InterfaceController from './../../../src/InterfaceController';
describe('fundamentals', () => {
  it('Open main page', () => {
    cy.visit('http://127.0.0.1:8080');
    cy.wait(2000); // ugly, wait for graphs to arrive
    cy.get('#\\:r3\\:').click();
    //cy.wait(10000); // ugly, wait for graphs to arrive
    //cy.get('body').contains("Drawing a chart").click();
  });


});
