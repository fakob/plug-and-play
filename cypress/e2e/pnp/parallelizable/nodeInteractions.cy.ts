import { doWithTestController } from '../helpers';
describe('nodeInteractions', () => {
  it('Add node', () => {
    cy.visit('http://127.0.0.1:8080/?new=true');

    cy.wait(100);
    doWithTestController((testController) => {
      expect(testController.addNode('Add', 'Add')).to.eq(true);
    });
    cy.wait(100);
    doWithTestController((testController) => {
      expect(testController.getNodes().length).to.eq(1);
    });
  });
});
