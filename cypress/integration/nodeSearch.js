describe('Test Node Search', () => {
  it('Visits the page and uses node searcher', () => {
    cy.visit('http://127.0.0.1:8080/');
    cy.contains('Search nodes').click();
    cy.get('input').last().type('NonExistingNode');
    cy.contains('Create "NonExistingNode"').click();
  });
});
