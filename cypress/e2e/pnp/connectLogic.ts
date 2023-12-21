
describe('connectLogic', () => {
  it('Get Test Controller', () => {

    cy.visit('http://127.0.0.1:8080/?new=true');

    cy.window().then(win => {
      expect((win as any).testController.identify()).to.eq("its testcontroller");
    });
    cy.wait(100);
    cy.window().then(win => {
      const anyWin = win as any;
      expect(anyWin.testController.addNode("Add")).to.eq(true);
      expect(anyWin.testController.addNode("Subtract")).to.eq(true);
      expect(anyWin.testController.addNode("Constant")).to.eq(true);
    });

    cy.wait(100);
    cy.window().then(win => {
      const anyWin = win as any;
      anyWin.testController.moveNodeByType("Constant", -200, 0);
      anyWin.testController.moveNodeByType("Subtract", 0, 200);
    });


    cy.wait(100);
    cy.window().then(win => {
      const anyWin = win as any;
      anyWin.testController.connectNodesByType("Constant", "Add", "Out");
      anyWin.testController.connectNodesByType("Subtract", "Add", "Subtracted");
    });

  });


});
