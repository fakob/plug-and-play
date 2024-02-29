import { doWithTestController, openNewGraph } from '../helpers';

describe('testHybridNodes', () => {
  it('Test Html node', () => {
    openNewGraph();
    cy.showMousePosition();
    doWithTestController(async (testController) => {
      await testController.addNode('HtmlRenderer', 'HtmlRenderer1');
      await testController.addNode('HtmlRenderer', 'HtmlRenderer2');
      await testController.addNode('CustomFunction', 'CustomFunction');
    }, 'addInitialNodes');
    doWithTestController((testController) => {
      const constantNode = testController.getNodeByID('HtmlRenderer1');
      const xPre = constantNode.x;
      testController.moveNodeByID('HtmlRenderer1', -300, 0);
      const xPost = constantNode.x;
      testController.moveNodeByID('HtmlRenderer2', 300, 0);
    });
    doWithTestController(async (testController) => {
      await testController.setNodeInputValue(
        'CustomFunction',
        'Code',
        `(a) => {
  return a.innerHTML;
}`,
      );
      await testController.connectNodesByID(
        'HtmlRenderer1',
        'CustomFunction',
        'HtmlElement',
        'a',
      );
      await testController.connectNodesByID(
        'CustomFunction',
        'HtmlRenderer2',
        'OutData',
        'Html',
      );
    }, 'connectThem');
    cy.wait(3000);
    doWithTestController((testController) => {
      const value = testController.getNodeInputValue('HtmlRenderer2', 'Html');
      cy.log(value);
      expect(value).to.include('<h2>HTML Node</h2>');
    });
  });
});
