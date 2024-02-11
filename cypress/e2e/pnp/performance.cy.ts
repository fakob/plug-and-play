import { doWithTestController, saveGraph } from "./helpers";

describe('performance', () => {
  it('Add node', () => {
    cy.visit('http://127.0.0.1:8080/?new=true');

    cy.wait(100);
    doWithTestController((testController) => {
      expect(testController.addNode('Add', 'Add')).to.eq(true);
    });
    saveGraph();
    cy.wait(100);
  });
  it('see that we didnt load from DB more than once', () => {
    cy.visit('http://127.0.0.1:8080');
    cy.wait(100);
    doWithTestController((testController) => {
      expect(testController.getTimesLoadedFromDB()).to.eq(1);
    });
  });
  it ("see that we didnt draw the nodes more than once", () => {
    cy.wait(500);
    doWithTestController((testController) => {
      expect(testController.getNodeTimesDrawn("Add")).to.eq(1);
    });

  });

});
