import { doWithTestController, openNewGraph } from "../helpers"

describe('connectLogic', () => {
  it('Add nodes', () => {
    openNewGraph();
    doWithTestController(testController => {
      expect(testController.addNode("Add", "Add")).to.eq(true);
      expect(testController.addNode("Subtract", "Subtract")).to.eq(true);
      expect(testController.addNode("Constant", "Constant")).to.eq(true);
    });
    cy.wait(100);
    doWithTestController(testController => {
      expect(testController.getNodeByID("Add").id).to.eq("Add");
    });
  });

  it("move nodes", () => {
    cy.wait(100);

    doWithTestController(testController => {
      const constantNode = testController.getNodeByID("Constant");
      const xPre = constantNode.x;
      testController.moveNodeByID("Constant", -200, 0);
      const xPost = constantNode.x;
      expect(xPost - xPre).to.eq(-200);
      testController.moveNodeByID("Subtract", 0, 200);

    });
  });

  it("connect nodes", () => {
    cy.wait(100);
    doWithTestController(testController => {
      testController.connectNodesByID("Constant", "Add", "Out", "Addend");
      testController.connectNodesByID("Subtract", "Add", "Subtracted", "Addend 2");
      testController.setNodeInputValue("Constant", "In", 10);
      testController.executeNodeByID("Constant");

    });

    cy.wait(100);
    doWithTestController(testController => {
      expect(testController.getNodeOutputValue("Add", "Added")).to.eq(10);
      expect(testController.getSocketLinks("Constant", "Out").length).to.eq(1);
    });
  });


  it("disconnect nodes", () => {
    cy.wait(100);
    doWithTestController(testController => {
      testController.disconnectLink("Add", "Addend");
    });

    cy.wait(100);
    doWithTestController(testController => {
      expect(testController.getNodeOutputValue("Add", "Added")).to.eq(0);
      expect(testController.getSocketLinks("Constant", "Out").length).to.eq(0);
    });

  });


  it("delete nodes", () => {
    cy.wait(100);
    doWithTestController(testController => {
      testController.removeNode("Add");
      testController.removeNode("Subtract");
      testController.removeNode("Constant");
    });

    cy.wait(100);
    doWithTestController(testController => {
      expect(testController.getNodes().length).to.eq(0);
    });

  });


});

