
describe('nodeInteractions', () => {
  it('Get Test Controller', () => {

    cy.visit('http://127.0.0.1:8080/?new=true');

    cy.window().then(win => {
      expect((win as any).testController.identify()).to.eq("its testcontroller");
    });
    cy.wait(100);
    cy.window().then(win => {
      expect((win as any).testController.addNode("Add")).to.eq(true);
    });
  });

  it ("Click socket and open menu", () => {
    cy.window().then(win => {
      const coordinates = (win as any).testController.getSocketCenterByNodeTypeAndSocketName("Add", "Added");
      console.log("coordinates: " + coordinates[0])
      cy.get('body').click(coordinates[0], coordinates[1]);
      cy.get("body").should("contain", "Shift+Click to add to dashboard");

      });
    });

});
