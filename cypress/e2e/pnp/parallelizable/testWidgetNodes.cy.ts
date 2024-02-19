import { doWithTestController, openNewGraph } from '../helpers';

describe('testWidgetNodes', () => {
  it('testDropdownWidget', () => {
    openNewGraph();
    doWithTestController((testController) => {
      testController.addNode('Constant', 'Constant');
      testController.addNode('WidgetDropdown', 'WidgetDropdown');
      testController.addNode('Label', 'Label');
    });
    cy.get('canvas').click();
    cy.wait(100);
    doWithTestController((testController) => {
      testController.moveNodeByID('Constant', -200, 0);
      testController.moveNodeByID('Label', 230, 0);
      testController.connectNodesByID(
        'Constant',
        'WidgetDropdown',
        'Out',
        'Select multiple',
      );
      testController.connectNodesByID('WidgetDropdown', 'Label', 'Out');
      testController.executeNodeByID('Constant');
    });
    cy.wait(100);
    doWithTestController((testController) => {
      expect(testController.getNodeOutputValue('WidgetDropdown', 'Out')).to.eq(
        '',
      );
    });
    cy.wait(1000);
    cy.get('.MuiSelect-select').click();
    cy.get('.MuiMenu-list li').contains('Option2').click();
    cy.get('.MuiSelect-select').should('have.text', 'Option2');
    cy.wait(100);
    doWithTestController((testController) => {
      expect(testController.getNodeOutputValue('WidgetDropdown', 'Out')).to.eq(
        'Option2',
      );
    });
    cy.wait(100);
    doWithTestController((testController) => {
      testController.setNodeInputValue('Constant', 'In', true);
      testController.executeNodeByID('Constant');
    });
    cy.wait(500);
    doWithTestController((testController) => {
      expect(testController.getNodeOutputValue('Label', 'Output')).to.eq(
        '["Option2"]',
      );
    });
    cy.wait(500);
    doWithTestController((testController) => {
      testController.setNodeInputValue('Constant', 'In', false);
      testController.executeNodeByID('Constant');
    });
    cy.wait(500);
    doWithTestController((testController) => {
      const out = testController.getNodeOutputValue('WidgetDropdown', 'Out');
      expect(testController.getNodeOutputValue('WidgetDropdown', 'Out')).to.eq(
        'Option2',
      );
    });
  });
});
