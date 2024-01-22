import { doWithTestController } from './helpers';

describe('testWidgetNodes', () => {
  it('testDropdownWidget', () => {
    cy.visit('http://127.0.0.1:8080/?new=true');
    cy.wait(100);
    doWithTestController((testController) => {
      expect(testController.addNode('Constant', 'Constant')).to.eq(true);
      expect(testController.addNode('WidgetDropdown', 'WidgetDropdown')).to.eq(
        true,
      );
      expect(testController.addNode('Label', 'Label')).to.eq(true);
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
    cy.wait(100);
    doWithTestController((testController) => {
      expect(testController.getNodeOutputValue('Label', 'Output')).to.eq(
        '["Option2"]',
      );
    });
    cy.wait(100);
    doWithTestController((testController) => {
      testController.setNodeInputValue('Constant', 'In', false);
      testController.executeNodeByID('Constant');
    });
    cy.wait(100);
    doWithTestController((testController) => {
      const out = testController.getNodeOutputValue('WidgetDropdown', 'Out');
      expect(testController.getNodeOutputValue('WidgetDropdown', 'Out')).to.eq(
        'Option2',
      );
    });
  });
});
