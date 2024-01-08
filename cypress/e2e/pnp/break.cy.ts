import { doWithTestController } from "./helpers";

// TODO implement
describe('break', () => {
    it("add break node", () => {
      cy.visit('http://127.0.0.1:8080/?new=true');
      cy.wait(100);
        doWithTestController(testController => {
            testController.addNode("Constant", "Constant");
            testController.addNode("Break", "Break");
            });
      });

    it ("arrange them", () => {
      cy.wait(100);
      doWithTestController(testController => {
        testController.moveNodeByID("Break", 200,0);
      });
    });
});
