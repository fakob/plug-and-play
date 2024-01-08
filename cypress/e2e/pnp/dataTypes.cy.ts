import { doWithTestController } from "./helpers";

// TODO expand
describe('dataTypes', () => {
  it("setup some nodes", () => {
    cy.visit('http://127.0.0.1:8080/?new=true');
    cy.wait(200);
    doWithTestController(testController => {
      expect(testController.addNode("WidgetSlider", "Slider")).to.eq(true);
      expect(testController.addNode("Label", "Label")).to.eq(true);
      expect(testController.addNode("CustomFunction", "CustomFunction")).to.eq(true);
    });
  });
  it ("expose label output", () => {
    cy.wait(100);
    doWithTestController(testController => {
      testController.moveNodeByID("Slider", 0, 100);
      testController.moveNodeByID("CustomFunction", 200, 0);
      // expose output on label
      testController.selectNodesById(["Label"]);
      cy.get('[data-cy="inspector-container-toggle-button"]').click();
      cy.get('#inspector-filter-out').click();
      cy.get('[data-cy="socket-visible-button"]').click();
    });
    });

  it ("write some text in the label node, see that it registers", () => {
    cy.wait(100);
    doWithTestController(testController => {
      const [x,y] = testController.getNodeCenter("Label");
      cy.get("body").dblclick(x, y);
      cy.get("body").type("testin");
    });
    cy.wait(100);
    doWithTestController(testController => {
      const value = testController.getNodeOutputValue("Label", "Output");
      expect(value).to.eq("testin");
    });
  });
  it ("see that the customfunction input is of type 'any'", () => {
    doWithTestController(testController => {
      const type = testController.getInputSocketType("CustomFunction", "a");
      expect(type).to.eq("Any");
    });
  });
  it ("connect label node with customfunction node", () => {
    doWithTestController(testController => {
      testController.connectNodesByID("Label", "CustomFunction", "Output");
    });
  });
  it ("see that customfunction input and output are now of string type", () => {
    cy.wait(100);
    doWithTestController(testController => {
      expect(testController.getInputSocketType("CustomFunction", "a")).to.eq("String");
      expect(testController.getOutputSocketType("CustomFunction", "OutData")).to.eq("String");
    });
  });
  it ("connect slider with customfunction node", () => {
    doWithTestController(testController => {
      testController.connectNodesByID("Slider", "CustomFunction", "Out");
    });
  });
  it ("see that customfunction input and output are now of number type", () => {
    cy.wait(100);
    doWithTestController(testController => {
      expect(testController.getInputSocketType("CustomFunction", "a")).to.eq("Number");
      expect(testController.getOutputSocketType("CustomFunction", "OutData")).to.eq("Number");
    });
  });
 });
