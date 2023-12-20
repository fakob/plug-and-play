
describe('nodeInteractions', () => {
  it('Get Test Controller', () => {

    cy.visit('http://127.0.0.1:8080/?new=true');

    cy.window().then(win => {
      expect((win as any).testController.identify()).to.eq("its testcontroller");
    });
  });
});
