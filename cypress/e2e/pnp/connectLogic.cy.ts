
describe('connectLogic', () => {
  it('Add nodes', () => {
    cy.visit('http://127.0.0.1:8080/?new=true');
    cy.wait(100);
    cy.window().then(win => {
      const anyWin = win as any;
      expect(anyWin.testController.addNode("Add", "Add")).to.eq(true);
      expect(anyWin.testController.addNode("Subtract", "Subtract")).to.eq(true);
      expect(anyWin.testController.addNode("Constant", "Constant")).to.eq(true);
    });
    cy.wait(100);
    cy.window().then(win => {
      const anyWin = win as any;
      expect(anyWin.testController.getNodeByID("Add").id).to.eq("Add");
    });
  });

  it("move nodes", () => {
    cy.wait(100);
    cy.window().then(win => {
      const anyWin = win as any;
      const constantNode = anyWin.testController.getNodeByID("Constant");
      const xPre = constantNode.x;
      anyWin.testController.moveNodeByID("Constant", -200, 0);
      const xPost = constantNode.x;
      expect(xPost - xPre).to.eq(-200);
      anyWin.testController.moveNodeByID("Subtract", 0, 200);
    });
  });

  it("connect nodes", () => {
    cy.wait(100);
    cy.window().then(win => {
      const anyWin = win as any;
      anyWin.testController.connectNodesByID("Constant", "Add", "Out");
      anyWin.testController.connectNodesByID("Subtract", "Add", "Subtracted");
      anyWin.testController.setNodeInputValue("Constant", "In", 10);
      anyWin.testController.executeNodeByID("Constant");
    });

    cy.wait(100);
    cy.window().then(win => {
      const anyWin = win as any;
      expect(anyWin.testController.getNodeOutputValue("Add", "Added")).to.eq(10);
    });
  });

});

