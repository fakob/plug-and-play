
describe('connectLogic', () => {
  it('Get Test Controller', () => {

    cy.visit('http://127.0.0.1:8080/?new=true');

    cy.window().then(win => {
      expect((win as any).testController.identify()).to.eq("its testcontroller");
    });
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
      anyWin.testController.moveNodeByID("Constant", -200, 0);
      anyWin.testController.moveNodeByID("Subtract", 0, 200);
    });

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
