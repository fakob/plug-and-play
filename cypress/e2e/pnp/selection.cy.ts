import { doWithTestController, dragFromAtoB } from "./helpers";

describe("selection", () => {

  it('add nodes', () => {
    cy.visit('http://127.0.0.1:8080/?new=true');

    cy.wait(100);
    doWithTestController((testController) => {
      expect(testController.addNode('Add', 'Add', 100, 100)).to.eq(true);
    });
    doWithTestController((testController) => {
      expect(testController.addNode('Constant', 'Constant', 100, 300)).to.eq(true);
    });
  });

  it ("select one node by clicking directly on it", () => {
    cy.wait(100);
    doWithTestController((testController) => {
      const [x,y] = testController.getNodeCenterById("Add");
      cy.get("body").realMouseDown({x: x, y: y});
      cy.get("body").realMouseUp();
    });
    cy.wait(100);
    doWithTestController((testController) => {
      expect(testController.getSelectedNodes().length).to.eq(1);
    });
  });

  it ("see that properties are accessible in inspectorcontainer", () => {
    cy.get('[data-cy="inspector-container-toggle-button"]').click();
    cy.get("body").contains("Addend").should("exist");
    cy.get('#inspector-filter-out').should("exist");
    cy.get('#inspector-filter-in').should("exist");

  });
  it ("move it", () => {
    cy.wait(100);
    let [prevX, prevY] = [0,0];
    doWithTestController((testController) => {
      [prevX,prevY] = testController.getNodeCenterById("Add");
      cy.get("body").realMouseDown({x: prevX, y: prevY});
      cy.get("body").realMouseMove(prevX + 100,prevY);
      cy.get("body").realMouseUp();
    });
    cy.wait(100);
    doWithTestController((testController) => {
      const [x] = testController.getNodeCenterById("Add");
      expect(x - prevX).to.be.within(99,101); // avoid rounding error
    });
  });

  it ("deselect", () => {
    cy.wait(100);
    let [prevX, prevY] = [0,0];
    doWithTestController((testController) => {
      [prevX,prevY] = testController.getNodeCenterById("Add");
    });
    cy.get("body").realMouseDown({x: prevX , y: prevY - 200});
    cy.get("body").realMouseUp();
    doWithTestController((testController) => {
      expect(testController.getSelectedNodes().length).to.eq(0);
    });
    // see that inspectorcontainer also lost it
    cy.get("body").contains("Addend").should("not.exist");
    cy.get('#inspector-filter-out').should("not.exist");
    cy.get('#inspector-filter-in').should("not.exist");
  });

  // TODO figure out why this doesnt work
/*
  it ("select multiple nodes using box", () => {
    cy.wait(100);
    doWithTestController((testController) => {
      const [x,y] = testController.getNodeCenterById("Add");
      dragFromAtoB(x - 300, y -300, x + 500, y + 500, true);
    });
  });
  */


});
