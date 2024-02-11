import { doWithTestController } from "./helpers";

describe("selection", () => {

  it('Add nodes', () => {
    cy.visit('http://127.0.0.1:8080/?new=true');

    cy.wait(100);
    doWithTestController((testController) => {
      expect(testController.addNode('Add', 'Add')).to.eq(true);
    });
  });

  it ("select one node by clicking directly on it", () => {
    cy.wait(100);
    doWithTestController((testController) => {
      const center = testController.getNodeCenterById("Add");
      cy.get("body").realMouseDown({x: center.x, y: center.y});
      cy.get("body").realMouseUp();

    });
  })
});
