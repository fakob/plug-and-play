import { doWithTestController, openNewGraph } from "../helpers";
describe('importing third party libraries and using', () => {

  it('Add nodes', () => {
    openNewGraph();
    doWithTestController(testController => {
      expect(testController.addNode("LoadNPM", "LoadNPM")).to.eq(true);
      expect(testController.addNode("CustomFunction", "CustomFunction")).to.eq(true);
    });
  });
  it ("Set up nodes, connect them", () => {
    cy.wait(100);
    doWithTestController(testController => {
      // set it to load chartjs
      testController.setNodeInputValue("LoadNPM", "packageName", "chart.js");
      testController.moveNodeByID("CustomFunction", 200,0);
      testController.connectNodesByID("LoadNPM", "CustomFunction", "NpmPackage");
      testController.executeNodeByID("LoadNPM");
    });
  })
  it ("See that the imported module makes it through as expected (once all is loaded)", () => {
    cy.wait(4000);
    // see that its there and loaded
    doWithTestController(testController => {
        testController.executeNodeByID("CustomFunction");
    });
    cy.wait(300);
    doWithTestController(testController => {
        expect(testController.getNodeOutputValue("CustomFunction","OutData").Chart.register).to.not.be.undefined; // we check that this function has survived through all this
    });
  });
});
