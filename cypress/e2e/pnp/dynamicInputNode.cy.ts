import { doWithTestController } from "./helpers";

describe('dynamic input node', () => {
  it('add nodes', () => {
    cy.visit('http://127.0.0.1:8080/?new=true');
    cy.wait(100);
    doWithTestController((testController) => {
      testController.addNode('Add', 'Add', 200, 0);
      testController.addNode('Constant', 'Constant');
    });
    cy.wait(100);
  });
  it('check for two inputs on the Add node', () => {
    cy.wait(100);
    doWithTestController((testController) => {
      expect(testController.getVisibleInputSockets("Add").length).to.eq(2);
    });
  });
  it('connect to the add node, expect there to still only be 2 inputs (because it should connect to one of the existing sockets)', () => {
    cy.wait(100);
    doWithTestController((testController) => {
      testController.connectNodesByID("Constant","Add");
    });
    cy.wait(100);
    doWithTestController((testController) => {
      expect(testController.getVisibleInputSockets("Add").length).to.eq(2);
      expect(testController.getSocketLinks("Constant", "Out").length).to.eq(1);
    });
  });

  it('disconnecting link should not cause any sockets to disappear', () => {
    cy.wait(100);
    doWithTestController((testController) => {
      testController.disconnectLink("Add", "Addend");
    });
    cy.wait(100);
    doWithTestController((testController) => {
      expect(testController.getVisibleInputSockets("Add").length).to.eq(2);
      expect(testController.getSocketLinks("Constant", "Out").length).to.eq(0);
    });
  });
});
