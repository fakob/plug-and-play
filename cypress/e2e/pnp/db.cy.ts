import { doWithTestController, saveGraph } from "./helpers";


const lengthOfArray = 10000;
describe('database', () => {
  it ("open new graph", () => {
    cy.visit('http://127.0.0.1:8080/?new=true');
    cy.wait(100);
    doWithTestController(testController => {
      testController.addNode("Constant","Constant");
    });
  });

  it ("save graph", () => {
    cy.wait(100);
    saveGraph();
    cy.wait(100);
  });
  it ("add large and stupid data", () => {
    doWithTestController(testController => {
      const largeValue = [];
      for (let i = 0; i < lengthOfArray; i++){
        largeValue.push("A");
      }
      testController.setNodeInputValue("Constant", "In", largeValue);
    });
  });
/*
  it ("save graph", () => {
    cy.wait(200);
    saveGraph();
    cy.wait(500);
  });
  it ("see that its there when opened again (and didnt take too long to load)", () => {
    cy.visit('http://127.0.0.1:8080');
    cy.wait(1500);

    doWithTestController(testController => {
      expect(testController.getNodeOutputValue("Constant","Out").length).to.eq(lengthOfArray);
    });

  });
  */
});
