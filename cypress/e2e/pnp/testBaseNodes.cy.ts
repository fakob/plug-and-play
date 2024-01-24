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

  it('IsValid', () => {
    cy.visit('http://127.0.0.1:8080/?new=true');
    cy.wait(100);
    doWithTestController((testController) => {
      expect(testController.addNode('IsValid', 'IsValid')).to.eq(true);
    });
    cy.wait(100);
    doWithTestController((testController) => {
      testController.setNodeInputValue('IsValid', 'A', null);
      testController.executeNodeByID('IsValid');
    });
    cy.wait(100);
    doWithTestController((testController) => {
      expect(testController.getNodeOutputValue('IsValid', 'Output')).to.eq(
        true,
      );
      testController.setNodeInputValue('IsValid', 'A', undefined);
      testController.executeNodeByID('IsValid');
    });
    cy.wait(100);
    doWithTestController((testController) => {
      expect(testController.getNodeOutputValue('IsValid', 'Output')).to.eq(
        true,
      );
      testController.setNodeInputValue('IsValid', 'A', 1);
      testController.executeNodeByID('IsValid');
    });
    cy.wait(100);
    doWithTestController((testController) => {
      expect(testController.getNodeOutputValue('IsValid', 'Output')).to.eq(
        false,
      );
      testController.setNodeInputValue(
        'IsValid',
        'Condition',
        'is NOT undefined',
      );
      testController.setNodeInputValue('IsValid', 'A', undefined);
      testController.executeNodeByID('IsValid');
    });
    cy.wait(100);
    doWithTestController((testController) => {
      expect(testController.getNodeOutputValue('IsValid', 'Output')).to.eq(
        false,
      );
      testController.setNodeInputValue('IsValid', 'A', true);
      testController.executeNodeByID('IsValid');
    });
    cy.wait(100);
    doWithTestController((testController) => {
      expect(testController.getNodeOutputValue('IsValid', 'Output')).to.eq(
        true,
      );
    });
  });
});
