import { doWithTestController, openNewGraph } from "../helpers"

describe('connectLogic', () => {
  it('Add nodes', () => {
    openNewGraph();
    doWithTestController(async testController => {
      await testController.addNode("Add", "Add");
      await testController.addNode("Subtract", "Subtract");
      await testController.addNode("Constant", "Constant");
    }, "addInitialNodes");
  });

  it("move nodes", () => {

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
    doWithTestController(async testController => {
      await testController.connectNodesByID("Constant", "Add", "Out", "Addend");
      await testController.connectNodesByID("Subtract", "Add", "Subtracted", "Addend 2");
      await testController.setNodeInputValue("Constant", "In", 10);
      await testController.executeNodeByID("Constant");

    },"connectem");

    doWithTestController(testController => {
      expect(testController.getNodeOutputValue("Add", "Added")).to.eq(10);
      expect(testController.getSocketLinks("Constant", "Out").length).to.eq(1);
    });
  });


  it("disconnect nodes", () => {
    doWithTestController(async testController => {
      await testController.disconnectLink("Add", "Addend");
    },"disconnectem");

    doWithTestController(testController => {
      expect(testController.getNodeOutputValue("Add", "Added")).to.eq(0);
      expect(testController.getSocketLinks("Constant", "Out").length).to.eq(0);
    });

  });


  it("delete nodes", () => {
    doWithTestController(async testController => {
      await testController.removeNode("Add");
      await testController.removeNode("Subtract");
      await testController.removeNode("Constant");
    },"deletem");

    doWithTestController(testController => {
      expect(testController.getNodes().length).to.eq(0);
    });

  });


});

