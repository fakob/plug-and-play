
describe('nodeInteractions', () => {
  it('Add node', () => {

    cy.visit('http://127.0.0.1:8080/?new=true');

    cy.wait(100);
    cy.window().then(win => {
      expect((win as any).testController.addNode("Add")).to.eq(true);
    });
    cy.wait(100);
    cy.window().then(win => {
      expect((win as any).testController.getNodes().length).to.eq(1);
    });
  });

  it("Click socket and open menu", () => {
    cy.window().then(win => {
      const coordinates = (win as any).testController.getSocketCenterByNodeTypeAndSocketName("Add", "Added");
      console.log("coordinates: " + coordinates[0])
      cy.get('body').click(coordinates[0], coordinates[1]);
      cy.get("body").should("contain", "Shift+Click to add to dashboard");

    });
  });

});
