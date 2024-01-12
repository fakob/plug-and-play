import { doWithTestController } from "./helpers";

describe('draw', () => {
    it("add draw shape and multiply nodes, connect them", () => {
      cy.visit('http://127.0.0.1:8080/?new=true');
      cy.wait(100);
      doWithTestController(testController => {
          testController.addNode("DRAW_Shape", "DRAW_Shape");
          testController.addNode("DRAW_Multiplier", "DRAW_Multiplier");
          });
          cy.wait(100);
          doWithTestController(testController => {
              testController.moveNodeByID("DRAW_Multiplier", 200,0);
              testController.connectNodesByID("DRAW_Shape", "DRAW_Multiplier", "Graphics");
          });
      });

    it("save the graph", () => {
      cy.wait(100);
      cy.get("body").type("{ctrl}s");
      });

    it("open it again, see that everything is still there", () => {
      cy.visit('http://127.0.0.1:8080');
        cy.wait(2000);
        doWithTestController(testController => {
          expect(testController.getNodes().length).to.eq(2);
        });
      });
});
