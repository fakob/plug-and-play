import { doWithTestController } from './helpers';

describe('testBaseNodes', () => {
  it('Comparison', () => {
    cy.visit('http://127.0.0.1:8080/?new=true');
    cy.wait(100);
    doWithTestController((testController) => {
      expect(testController.addNode('Comparison', 'Comparison')).to.eq(true);
    });
    cy.wait(100);
    doWithTestController((testController) => {
      testController.setNodeInputValue('Comparison', 'A', 400);
      testController.setNodeInputValue('Comparison', 'B', 300);
      testController.executeNodeByID('Comparison');
    });
    cy.wait(100);
    doWithTestController((testController) => {
      expect(testController.getNodeOutputValue('Comparison', 'Output')).to.eq(
        true,
      );
      testController.setNodeInputValue('Comparison', 'A', 200);
      testController.executeNodeByID('Comparison');
    });
    cy.wait(100);
    doWithTestController((testController) => {
      expect(testController.getNodeOutputValue('Comparison', 'Output')).to.eq(
        false,
      );
      testController.setNodeInputValue(
        'Comparison',
        'Operator',
        'Logical AND (&&)',
      );
      testController.setNodeInputValue('Comparison', 'A', true);
      testController.setNodeInputValue('Comparison', 'B', true);
      testController.executeNodeByID('Comparison');
    });
    cy.wait(100);
    doWithTestController((testController) => {
      expect(testController.getNodeOutputValue('Comparison', 'Output')).to.eq(
        true,
      );
      testController.setNodeInputValue('Comparison', 'A', true);
      testController.setNodeInputValue('Comparison', 'B', false);
      testController.executeNodeByID('Comparison');
    });
    cy.wait(100);
    doWithTestController((testController) => {
      expect(testController.getNodeOutputValue('Comparison', 'Output')).to.eq(
        false,
      );
    });
  });
});
