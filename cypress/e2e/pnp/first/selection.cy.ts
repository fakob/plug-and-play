import { doWithTestController, openNewGraph } from "../helpers";

describe("selection", () => {
  it('add nodes', () => {
    openNewGraph();

    doWithTestController(async (testController) => {
      await testController.addNode('Add', 'Add', -100, 0);
      await testController.addNode('Constant', 'Constant', 0, 200);
    }, "addNodes");
  });


  it("select one node by clicking directly on it", () => {
    doWithTestController(async (testController) => {
      const [x, y] = testController.getNodeCenterById("Add");
      cy.get("body").realMouseDown({ x: x, y: y });
      cy.get("body").realMouseUp();
    }, "clickety");
    //cy.wait(100);
    doWithTestController((testController) => {
      expect(testController.getSelectedNodes().length).to.eq(1);
    });
  });

  it("see that properties are accessible in inspectorcontainer", () => {
    cy.get('[data-cy="inspector-container-toggle-button"]').click();
    cy.get("body").contains("Addend").should("exist");
    cy.get('#inspector-filter-out').should("exist");
    cy.get('#inspector-filter-in').should("exist");
  });

  /*
  it("move it", () => {
    cy.wait(100);
    let [prevX, prevY] = [0, 0];
    doWithTestController((testController) => {
      [prevX, prevY] = testController.getNodeCenterById("Add");
      cy.get("body").realMouseDown({ x: prevX, y: prevY });
      cy.get("body").realMouseMove(prevX + 100, prevY);
      cy.get("body").realMouseUp();
    });
    cy.wait(100);
    doWithTestController((testController) => {
      const [x] = testController.getNodeCenterById("Add");
      expect(x - prevX).to.be.within(99, 101); // avoid rounding error
    });
  });

  // is this causing CI to hang?
  
  
  it ("deselect", () => {
    doWithTestController((testController) => {
      let [prevX,prevY] = testController.getNodeCenterById("Add");
      console.log("PREVX: " + prevX)

      cy.get("body").realMouseMove( prevX , prevY - 100);
      cy.get("body").realMouseDown({x: prevX  , y: prevY - 100});
      cy.get("body").realMouseUp({x: prevX, y: prevY - 100});
      doWithTestController((testController) => {
        expect(testController.getSelectedNodes().length).to.eq(0);
      });
      // see that inspectorcontainer also lost it
      cy.get("body").contains("Addend").should("not.exist");
      cy.get('#inspector-filter-out').should("not.exist");
      cy.get('#inspector-filter-in').should("not.exist");
    });
  });


  it("hover over socket", () => {
    doWithTestController((testController) => {
      const [x,y] = testController.getSocketCenterByNodeIDAndSocketName("Constant", "In");
      cy.get("body").realMouseMove(x,y);
      cy.get("body").contains("Shift+Click to add to dashboard")
    });
  });

  it ("select multiple nodes using box", () => {
    cy.wait(100);
    doWithTestController((testController) => {
      const [x,y] = testController.getNodeCenterById("Add");
      const startPosX = x ;
      const startPosY = y -100;

      cy.get("body").realMouseMove(startPosX, startPosY);
      cy.get("body").realMouseDown({x: startPosX,y: startPosY});
      cy.get("body").realMouseMove(x + 50 ,y + 200);
      cy.get("body").realMouseUp();


    });
    // see that they were both selected
    cy.wait(100);
    doWithTestController((testController) => {
      expect(testController.getSelectedNodes().length).to.eq(2);
    });
  });

  it("drag selection", () => {

    let [prevXAdd, prevYAdd] = [0,0];
    let [prevXConst, prevYConst] = [0,0];
    doWithTestController((testController) => {
      [prevXAdd,prevYAdd] = testController.getNodeCenterById("Add");
      [prevXConst,prevYConst] = testController.getNodeCenterById("Constant");
      cy.get("body").realMouseMove(prevXAdd, prevYAdd);
      cy.get("body").realMouseDown({x: prevXAdd,y: prevYAdd});
      cy.get("body").realMouseMove(prevXAdd , prevYAdd - 100);
      cy.get("body").realMouseUp();
    });
    cy.wait(100);
    doWithTestController((testController) => {
      const [newXAdd,newYAdd] = testController.getNodeCenterById("Add");
      const [newXConst,newYConst] = testController.getNodeCenterById("Constant");
      expect(newYAdd).to.be.within(prevYAdd -101, prevYAdd - 99);
      expect(newYConst).to.be.within(prevYConst -101, prevYConst - 99);
    });
  });
  */
});
