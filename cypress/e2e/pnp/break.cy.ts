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
    it ("try a massive break node input, see that it results in 100 output sockets", () => {
      doWithTestController(testController => {
        const breakInput = {};
        for (let i = 0; i < 10000; i++){
          breakInput[i.toString()] = i;
        }
      testController.setNodeInputValue("Break", "JSON",breakInput);
      testController.executeNodeByID("Break");
      });

      cy.wait(100);
      doWithTestController(testController => {
        expect(testController.getOutputSockets("Break").length).to.eq(100);
      });
    });

    it ("try very nested JSON, save", () => {
      const base = {};
      let current = base;
      for (let i = 0; i < 100; i++){
        const next = {"a":{}};
        current["c"] = "hello";
        current["d"] = 1;
        current["b"] = next;
        current = next;
      }
      doWithTestController(testController => {
        testController.setNodeInputValue("Break", "JSON",base);
        testController.executeNodeByID("Break");
      });
      cy.wait(100);
      doWithTestController(testController => {
        // see that we get an object out
        expect(typeof testController.getNodeOutputValue("Break","b")).to.eq("object");
      });
    });

    it ("try the output from constant", () => {
      doWithTestController(testController => {
        testController.connectNodesByID("Constant","Break","Out");
      });
      cy.get("body").type("{ctrl}s")
    });

    it ("See that we are not corrupting the output from the constant node", () => {
      cy.wait(100);
      doWithTestController(testController => {
        expect(testController.getOutputSocketType("Constant", "Out")).to.eq("Number")
      });
    });

    /*it ("load it again", () => {
      cy.visit('http://127.0.0.1:8080');

      cy.wait(3000);
      doWithTestController(testController => {
        expect(testController.getNodes().length).to.eq(2);
      });
    });
    */
});
