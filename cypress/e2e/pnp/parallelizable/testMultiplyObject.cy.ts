import { doWithTestController } from '../helpers';

describe('testMultiplyObject', () => {
  it('Check index of multiply object', () => {
    cy.visit('http://127.0.0.1:8080/?new=true');
    cy.wait(100);
    doWithTestController((testController) => {
      expect(testController.addNode('DRAW_Shape', 'DRAW_Shape')).to.eq(true);
      expect(
        testController.addNode('DRAW_Multiplier', 'DRAW_Multiplier'),
      ).to.eq(true);
    });
    cy.wait(100);
    doWithTestController((testController) => {
      testController.moveNodeByID('DRAW_Shape', 0, -200);
      testController.moveNodeByID('DRAW_Multiplier', 0, 100);
      testController.connectNodesByID(
        'DRAW_Shape',
        'DRAW_Multiplier',
        'Graphics',
      );
      testController.setNodeInputValue('DRAW_Shape', 'Offset X', 200);
      testController.setNodeInputValue(
        'DRAW_Multiplier',
        'Clickable objects',
        true,
      );
      testController.setNodeInputValue('DRAW_Multiplier', 'Spacing X', 200);
      testController.setNodeInputValue('DRAW_Multiplier', 'Offset X', 0);
      testController.executeNodeByID('DRAW_Shape');
      expect(
        testController.getNodeOutputValue(
          'DRAW_Multiplier',
          'LastPressedIndex',
        ),
      ).to.eq(-1);
      cy.get('body').click(920, 530); // click on second circle
    });
    cy.wait(100);
    doWithTestController((testController) => {
      expect(
        testController.getNodeOutputValue(
          'DRAW_Multiplier',
          'LastPressedIndex',
        ),
      ).to.eq(1);
    });
    cy.wait(100);
  });
});
