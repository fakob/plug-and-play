import { doWithTestController } from "../helpers";

// TODO make this execute a lil quicker
describe('http', () => {
  it('add http node', () => {
    cy.visit('http://127.0.0.1:8080/?new=true');
    cy.wait(100);
    doWithTestController((testController) => {
      testController.addNode('HTTPNode', 'HTTPNode');
    });
  });
  it ("see that the default request address results in an array of length 100", () => {
    cy.wait(6000);
    doWithTestController((testController) => {
      const output = testController.getNodeOutputValue("HTTPNode", "Content");
      expect(output.length).to.eq(100);
    });
  });
  it ("we should now have 200 as status, and not anything else", () => {
    doWithTestController((testController) => {
      const statuses = testController.getNodeCustomStatuses("HTTPNode");
      expect(statuses.length).to.eq(1);
      expect(statuses[0].message).to.contain("200");
    });
  });
  it ("try an invalid address", () => {
    doWithTestController((testController) => {
      testController.setNodeInputValue("HTTPNode", "URL", "https://veryinvalidurl");
      testController.executeNodeByID("HTTPNode");
    });
  });
  it ("see that we have an error status on the node", () => {
    cy.wait(10000);
    doWithTestController((testController) => {
      const statuses = testController.getNodeCustomStatuses("HTTPNode");
      expect(statuses.length).to.eq(1);
      expect(statuses[0].message).to.contain("400");
    });
  });
});
