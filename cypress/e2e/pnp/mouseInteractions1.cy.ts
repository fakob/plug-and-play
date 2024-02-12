import {
  areCoordinatesClose,
  afterEachMouseInteraction,
  beforeEachMouseInteraction,
  doWithTestController,
  dragFromAtoB,
} from './helpers';

describe('mouseInteractions1', () => {
  beforeEach(() => {
    beforeEachMouseInteraction();
  });

  afterEach(() => {
    afterEachMouseInteraction();
  });

  // Graph interactions
  it('Opens node browser on double clicking', () => {
    doWithTestController((testController) => {
      cy.get('body').dblclick(400, 200);
      cy.wait(500);
      cy.get('#node-search[placeholder*="Search nodes"]').should('be.visible');
    });
  });

  it('Selects all nodes within drag area on dragging over graph', () => {
    const startX = 100;
    const startY = 100;
    const endX = 860;
    const endY = 460;

    doWithTestController((testController) => {
      dragFromAtoB(startX, startY, endX, endY);
    });
    doWithTestController((testController) => {
      expect(testController.getSelectedNodes().length).to.eq(2);
    });
  });

  it('Deselects all nodes on clicking graph without dragging', () => {
    doWithTestController((testController) => {
      const [x, y] = testController.getNodeCenterById('Constant1');
      cy.wait(100);
      cy.get('body').click(x, y);
    });
    cy.wait(100);
    doWithTestController((testController) => {
      expect(testController.getSelectedNodes().length).to.eq(1);
      cy.get('body').click(100, 100);
    });
    cy.wait(1000);
    doWithTestController((testController) => {
      expect(testController.getSelectedNodes().length).to.eq(0);
    });
  });

  it('Shows selection tooltip after selecting all nodes within drag area on dragging over graph and releasing over node', () => {
    const startX = 100;
    const startY = 100;

    doWithTestController((testController) => {
      const [endX, endY] = testController.getNodeCenterById('Constant2');
      dragFromAtoB(startX, startY, endX, endY);
    });
    doWithTestController((testController) => {
      expect(testController.getSelectedNodes().length).to.eq(2);
      cy.get('body').should('contain', '2 nodes selected');
    });
  });

  it('Shows selection tooltip after selecting all nodes within drag area on dragging over graph and releasing over socket', () => {
    const startX = 100;
    const startY = 100;

    doWithTestController((testController) => {
      const [endX, endY] = testController.getSocketCenterByNodeIDAndSocketName(
        'Constant2',
        'In',
      );
      dragFromAtoB(startX, startY, endX, endY);
    });
    doWithTestController((testController) => {
      expect(testController.getSelectedNodes().length).to.eq(2);
      cy.get('body').should('contain', '2 nodes selected');
    });
  });

  // Node interactions
  it('Drags node and releasing it over graph', () => {
    const endX = 860;
    const endY = 460;

    doWithTestController((testController) => {
      const [startX, startY] = testController.getNodeCenterById('Constant1');
      dragFromAtoB(startX, startY, endX, endY);
    });
    doWithTestController((testController) => {
      const [newX, newY] = testController.getNodeCenterById('Constant1');
      expect(areCoordinatesClose(newX, newY, endX, endY)).to.be.true;
    });
  });

  it('Drags node and releasing it over node', () => {
    let endX;
    let endY;

    doWithTestController((testController) => {
      const [startX, startY] = testController.getNodeCenterById('Constant1');
      const endPos = testController.getNodeCenterById('Constant2');
      endX = endPos[0] + 20;
      endY = endPos[1] + 20;
      dragFromAtoB(startX, startY, endX, endY);
    });
    doWithTestController((testController) => {
      const [newX, newY] = testController.getNodeCenterById('Constant1');
      expect(areCoordinatesClose(newX, newY, endX, endY)).to.be.true;
    });
  });

  it('Selects node on clicking node without dragging', () => {
    doWithTestController((testController) => {
      const coordinates = testController.getNodeCenterById('Constant1');
      cy.wait(100);
      cy.get('body').click(coordinates[0], coordinates[1]);
    });
    cy.wait(100);
    doWithTestController((testController) => {
      expect(testController.getSelectedNodes().length).to.eq(1);
    });
  });

  it('Drags node and releasing it over socket', () => {
    let endX;
    let endY;

    doWithTestController((testController) => {
      const [startX, startY] = testController.getNodeCenterById('Constant1');
      const endPos = testController.getSocketCenterByNodeIDAndSocketName(
        'Constant2',
        'In',
      );
      endX = endPos[0];
      endY = endPos[1];
      dragFromAtoB(startX, startY, endX, endY);
    });
    doWithTestController((testController) => {
      const [newX, newY] = testController.getNodeCenterById('Constant1');
      expect(areCoordinatesClose(newX, newY, endX, endY)).to.be.true;
    });
  });

  // Socket interactions
  // General
  it('Show floating inspector on hovering socket', () => {
    doWithTestController((testController) => {
      const [x, y] = testController.getSocketCenterByNodeIDAndSocketName(
        'Constant2',
        'In',
      );
      cy.get('body').click(x, y);
      cy.get('body').should('contain', 'Shift+Click to add to dashboard');
    });
  });

  it('Does nothing on clicking connected and dynamic input socket without or minimal dragging', () => {
    const moveX = 5;
    const moveY = 5;
    doWithTestController((testController) => {
      expect(testController.addNode('Add', 'Add')).to.eq(true);
    });
    cy.wait(100);
    doWithTestController((testController) => {
      testController.moveNodeByID('Add', 230, -100);
    });
    cy.wait(100);
    doWithTestController((testController) => {
      const [startX, startY] =
        testController.getSocketCenterByNodeIDAndSocketName('Constant1', 'Out');
      const [endX, endY] = testController.getNodeCenterById('Add');
      dragFromAtoB(startX, startY, endX, endY, true);
    });

    doWithTestController((testController) => {
      const [startX, startY] =
        testController.getSocketCenterByNodeIDAndSocketName('Add', 'Added');
      dragFromAtoB(startX, startY, startX + moveX, startY + moveY, true);
    });
    cy.wait(1000);
    doWithTestController((testController) => {
      cy.get('#node-search[placeholder*="Search nodes"]').should(
        'not.be.visible',
      );
      expect(testController.getSocketLinks('Constant1', 'Out').length).to.eq(2);
      expect(testController.getSocketLinks('Constant2', 'In').length).to.eq(1);
    });
  });

  // Context menu
  it('Opens graph context menu on right-clicking graph', () => {
    doWithTestController((testController) => {
      cy.get('body').rightclick(400, 200);
      cy.wait(100);
      cy.get('body').should('contain', 'Open playground');
    });
  });

  it('Opens node context menu on right-clicking node', () => {
    doWithTestController((testController) => {
      const coordinates = testController.getNodeCenterById('Constant2');
      cy.wait(100);
      cy.get('body').rightclick(coordinates[0], coordinates[1]);
      cy.wait(100);
      cy.get('body').should('contain', 'Replace with');
    });
  });

  it('Opens socket context menu on right-clicking socket', () => {
    doWithTestController((testController) => {
      const coordinates =
        testController.getSocketLabelCenterByNodeIDAndSocketName(
          'Constant2',
          'In',
        );
      cy.wait(1000); // for this test the waiting time needs to be longer?!
      cy.get('body').rightclick(coordinates[0], coordinates[1]);
      cy.wait(100);
      cy.get('body').should('contain', 'Show node inspector');
    });
  });
});
