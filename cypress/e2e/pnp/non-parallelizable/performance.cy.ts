import { doWithTestController, openExistingGraph, openNewGraph, saveGraph, } from "../helpers";

describe('performance', () => {
  it('Add node', () => {
    openNewGraph();
    doWithTestController(async (testController) => {
      await testController.addNode('Add', 'Add');
    },"addnode");
    saveGraph();
  });
  it('see that we didnt load from DB more than once', () => {
    openExistingGraph();
    doWithTestController((testController) => {
      expect(testController.getTimesLoadedFromDB()).to.eq(1);
    });
  });
  // TODO figure out why this doesnt work
  /*
  it ("see that we didnt draw the nodes more than once", () => {
    cy.wait(100);
    doWithTestController((testController) => {
      expect(testController.getNodeTimesDrawn("Add")).to.eq(1);
    });

  });
  */

});
