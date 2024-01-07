import { doWithTestController } from "./helpers";

// TODO implement, check data type logic stuff
describe('dataTypes', () => {
    it("setup some nodes", () => {
    cy.visit('http://127.0.0.1:8080/?new=true');
    cy.wait(200);
    doWithTestController(testController => {
      expect(testController.addNode("WidgetSlider", "Slider")).to.eq(true);
      expect(testController.addNode("Label", "Label")).to.eq(true);
    });
  });
  it ("expose label output", () => {
    cy.wait(100);
    doWithTestController(testController => {
      testController.moveNodeByID("Slider", 0, 100);
      // expose output on label
      testController.selectNodesById(["Label"]);
      cy.get('[data-cy="inspector-container-toggle-button"]').click();
      cy.get('#inspector-filter-out').click();
      cy.get('[data-cy="socket-visible-button"]').click();
    });
    });

  it ("write some text in the label node", () => {
    cy.wait(100);
    doWithTestController(testController => {
      testController.selectNodesById(["Label"]);
    });
    });
 });
