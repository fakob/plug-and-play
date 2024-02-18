import { doWithTestController, saveGraph } from './helpers';

describe('socketLoading', () => {
  let serialized = undefined;
  it('Add test node and change socket data type parameters', () => {
    cy.visit('http://127.0.0.1:8080/?new=true');

    // add nodes
    cy.wait(100);
    doWithTestController((testController) => {
      cy.get('[data-cy="inspector-container-toggle-button"]').click();
      cy.wait(100);
      expect(testController.addNode('TestDataTypes', 'TestDataTypes')).to.eq(
        true,
      );
    });
    cy.wait(100);
    doWithTestController((testController) => {
      testController.moveNodeByID('TestDataTypes', 0, -300);
      const coordinates = testController.getNodeCenterById('TestDataTypes');
      cy.wait(100);
      cy.get('body').click(coordinates[0], coordinates[1]);
    });
    cy.get('#inspector-socket-Enum').click();

    // changing enumType selection
    cy.get('.MuiMenu-list li').contains('option 2').click();
    cy.get('#inspector-socket-Enum  .MuiSelect-select').should(
      'have.text',
      'option 2',
    );

    // changing min and max of numberType
    cy.get('[data-cy="Number (int)-min"] input').type('{selectall}3');
    cy.get('[data-cy="Number (int)-max"] input').type('{selectall}66');
    cy.wait(100);

    // changing trigger method of triggerType
    cy.get('[data-cy="Trigger-trigger-method"]').click();
    cy.get('.MuiMenu-list li').contains('negativeFlank').click();
    cy.get('[data-cy="Trigger-trigger-method"] .MuiSelect-select').should(
      'have.text',
      'negativeFlank',
    );
  });

  it('Save graph', () => {
    cy.wait(100);
    saveGraph();
    cy.wait(100);
  });

  it('See that socket data type parameters are still there after reload', () => {
    cy.visit('http://127.0.0.1:8080');
    cy.wait(1000);
    doWithTestController((testController) => {
      const coordinates = testController.getNodeCenterById('TestDataTypes');
      cy.wait(100);
      cy.get('[data-cy="inspector-container-toggle-button"]').click();
      cy.wait(100);
      cy.get('body').click(coordinates[0], coordinates[1]);
      cy.wait(100);
      cy.get('[data-cy="Number (int)-min"] input').should('have.value', '3');
      cy.get('[data-cy="Number (int)-max"] input').should('have.value', '66');
      cy.get('[data-cy="Trigger-trigger-method"] .MuiSelect-select').should(
        'have.text',
        'negativeFlank',
      );
    });
  });
});
