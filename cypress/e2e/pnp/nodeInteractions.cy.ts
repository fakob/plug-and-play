
describe('nodeInteractions', () => {
  it('Add node with double click', () => {
    cy.visit('http://127.0.0.1:8080/?new=true');
    cy.get('#pixi-container > canvas').dblclick();
    cy.focused().type('Add{enter}');
  });
});
