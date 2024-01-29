import { start } from 'repl';
import {
  areCoordinatesClose,
  controlOrMetaKey,
  doWithTestController,
} from './helpers';

describe('mouseInteractions', () => {
  const dragFromAtoB = (startX, startY, endX, endY, wait = false) => {
    cy.get('body')
      .realMouseMove(startX, startY)
      .wait(wait ? 500 : 0) // adds waiting time when dragging connections
      .realMouseDown({ x: startX, y: startY })
      .realMouseMove(endX, endY)
      .realMouseUp({ x: endX, y: endY });
    cy.wait(1000);
  };

  beforeEach(() => {
    cy.visit('http://127.0.0.1:8080/?new=true');
    cy.wait(2000);
    // cy.get('body').type(`${controlOrMetaKey()}{shift}Y`); // enable debug view
    cy.get('body').type('1'); // enable debug view
    doWithTestController((testController) => {
      testController.setShowUnsavedChangesWarning(false);
      expect(testController.addNode('Constant', 'Constant1')).to.eq(true);
      expect(testController.addNode('Constant', 'Constant2')).to.eq(true);
    });
    cy.wait(100);
    doWithTestController((testController) => {
      testController.moveNodeByID('Constant2', 230, 0);
      testController.connectNodesByID('Constant1', 'Constant2', 'Out', 'In');
    });
    cy.showMousePosition();
  });

  afterEach(() => {
    if (Cypress.$('#custom-mouse-pointer').length) {
      Cypress.$('#custom-mouse-pointer').remove();
    }
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

  // it('Deselects all nodes on clicking graph without dragging', () => {
  //   doWithTestController((testController) => {
  //     const [x, y] = testController.getNodeCenterById('Constant1');
  //     cy.wait(100);
  //     cy.get('body').click(x, y);
  //   });
  //   cy.wait(100);
  //   doWithTestController((testController) => {
  //     expect(testController.getSelectedNodes().length).to.eq(1);
  //     cy.get('body').click(100, 100);
  //   });
  //   cy.wait(1000);
  //   doWithTestController((testController) => {
  //     expect(testController.getSelectedNodes().length).to.eq(0);
  //   });
  // });

  // it('Shows selection tooltip after selecting all nodes within drag area on dragging over graph and releasing over node', () => {
  //   const startX = 100;
  //   const startY = 100;

  //   doWithTestController((testController) => {
  //     const [endX, endY] = testController.getNodeCenterById('Constant2');
  //     dragFromAtoB(startX, startY, endX, endY);
  //   });
  //   doWithTestController((testController) => {
  //     expect(testController.getSelectedNodes().length).to.eq(2);
  //     cy.get('body').should('contain', '2 nodes selected');
  //   });
  // });

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

  // Output socket with no connection
  it('Opens node browser on dragging from unconnected output socket to graph', () => {
    const endX = 660;
    const endY = 200;

    doWithTestController((testController) => {
      const [startX, startY] =
        testController.getSocketCenterByNodeIDAndSocketName('Constant2', 'Out');
      dragFromAtoB(startX, startY, endX, endY, true);
    });
    cy.wait(1000);
    cy.get('#node-search[placeholder*="Search nodes"]').should('be.visible');
    cy.get('#node-search[placeholder*="Search nodes"]').type('{enter}');
    cy.wait(100);
    doWithTestController((testController) => {
      expect(testController.getNodes().length).to.eq(3);
    });
  });

  it('Creates a connection to preferred socket on dragging from unconnected output socket to node', () => {
    doWithTestController((testController) => {
      expect(testController.addNode('Constant', 'Constant3')).to.eq(true);
      expect(testController.addNode('Constant', 'Constant4')).to.eq(true);
    });
    cy.wait(100);
    doWithTestController((testController) => {
      testController.moveNodeByID('Constant3', 0, -100);
      testController.moveNodeByID('Constant4', 230, -100);
    });
    cy.wait(100);
    doWithTestController((testController) => {
      const [startX, startY] =
        testController.getSocketCenterByNodeIDAndSocketName('Constant3', 'Out');
      const [endX, endY] = testController.getNodeCenterById('Constant4');
      dragFromAtoB(startX, startY, endX, endY, true);
    });
    doWithTestController((testController) => {
      expect(
        testController.getSocketLinks('Constant4', 'In')[0].source.getNode().id,
      ).to.eq('Constant3');
    });
  });

  it('Creates a connection on dragging from unconnected output socket to input socket without a connection', () => {
    doWithTestController((testController) => {
      expect(testController.addNode('Constant', 'Constant3')).to.eq(true);
      expect(testController.addNode('Constant', 'Constant4')).to.eq(true);
    });
    cy.wait(100);
    doWithTestController((testController) => {
      testController.moveNodeByID('Constant3', 0, -100);
      testController.moveNodeByID('Constant4', 230, -100);
    });
    cy.wait(100);
    doWithTestController((testController) => {
      const [startX, startY] =
        testController.getSocketCenterByNodeIDAndSocketName('Constant3', 'Out');
      const [endX, endY] = testController.getSocketCenterByNodeIDAndSocketName(
        'Constant4',
        'In',
      );
      dragFromAtoB(startX, startY, endX, endY, true);
    });
    doWithTestController((testController) => {
      expect(
        testController.getSocketLinks('Constant4', 'In')[0].source.getNode().id,
      ).to.eq('Constant3');
    });
  });

  it('Creates a connection and removes previous one on dragging from unconnected output socket to input socket with a connection', () => {
    doWithTestController((testController) => {
      expect(
        testController.getSocketLinks('Constant2', 'In')[0].source.getNode().id,
      ).to.eq('Constant1');
      expect(testController.addNode('Constant', 'Constant3')).to.eq(true);
      cy.wait(100);
    });
    doWithTestController((testController) => {
      testController.moveNodeByID('Constant3', 0, -100);
    });
    cy.wait(100);
    doWithTestController((testController) => {
      const [startX, startY] =
        testController.getSocketCenterByNodeIDAndSocketName('Constant3', 'Out');
      const [endX, endY] = testController.getSocketCenterByNodeIDAndSocketName(
        'Constant2',
        'In',
      );
      dragFromAtoB(startX, startY, endX, endY, true);
    });
    doWithTestController((testController) => {
      expect(
        testController.getSocketLinks('Constant2', 'In')[0].source.getNode().id,
      ).to.eq('Constant3');
    });
  });

  it('Does nothing on clicking unconnected output socket without or minimal dragging', () => {
    const moveX = 5;
    const moveY = 5;

    doWithTestController((testController) => {
      expect(testController.addNode('Constant', 'Constant3')).to.eq(true);
    });
    cy.wait(100);
    doWithTestController((testController) => {
      testController.moveNodeByID('Constant3', 0, -100);
    });
    doWithTestController((testController) => {
      const [startX, startY] =
        testController.getSocketCenterByNodeIDAndSocketName('Constant3', 'Out');
      dragFromAtoB(startX, startY, startX + moveX, startY + moveY, true);
    });
    cy.get('#node-search[placeholder*="Search nodes"]').should(
      'not.be.visible',
    );
  });

  // Output socket with connection
  it('Opens node browser on dragging from connected output socket to graph', () => {
    const endX = 660;
    const endY = 200;

    doWithTestController((testController) => {
      const [startX, startY] =
        testController.getSocketCenterByNodeIDAndSocketName('Constant1', 'Out');
      dragFromAtoB(startX, startY, endX, endY, true);
    });
    cy.wait(1000);
    cy.get('#node-search[placeholder*="Search nodes"]').should('be.visible');
    cy.get('#node-search[placeholder*="Search nodes"]').type('{enter}');
    doWithTestController((testController) => {
      expect(testController.getNodes().length).to.eq(3);
    });
  });

  it('Creates a connection to preferred socket on dragging from connected output socket to node', () => {
    doWithTestController((testController) => {
      expect(testController.addNode('Constant', 'Constant4')).to.eq(true);
    });
    cy.wait(100);
    doWithTestController((testController) => {
      testController.moveNodeByID('Constant4', 230, -100);
    });
    cy.wait(100);
    doWithTestController((testController) => {
      const [startX, startY] =
        testController.getSocketCenterByNodeIDAndSocketName('Constant1', 'Out');
      const [endX, endY] = testController.getNodeCenterById('Constant4');
      dragFromAtoB(startX, startY, endX, endY, true);
    });
    doWithTestController((testController) => {
      expect(
        testController.getSocketLinks('Constant4', 'In')[0].source.getNode().id,
      ).to.eq('Constant1');
    });
  });

  it('Creates a connection on dragging from connected output socket to input socket without a connection', () => {
    doWithTestController((testController) => {
      expect(testController.addNode('Constant', 'Constant4')).to.eq(true);
    });
    cy.wait(100);
    doWithTestController((testController) => {
      testController.moveNodeByID('Constant4', 230, -100);
    });
    cy.wait(100);
    doWithTestController((testController) => {
      const [startX, startY] =
        testController.getSocketCenterByNodeIDAndSocketName('Constant1', 'Out');
      const [endX, endY] = testController.getSocketCenterByNodeIDAndSocketName(
        'Constant4',
        'In',
      );
      dragFromAtoB(startX, startY, endX, endY, true);
    });
    doWithTestController((testController) => {
      expect(
        testController.getSocketLinks('Constant4', 'In')[0].source.getNode().id,
      ).to.eq('Constant1');
    });
  });

  it('Creates a connection on dragging from connected output socket to input socket with a connection', () => {
    doWithTestController((testController) => {
      expect(testController.addNode('Constant', 'Constant3')).to.eq(true);
      expect(testController.addNode('Constant', 'Constant4')).to.eq(true);
    });
    cy.wait(100);
    doWithTestController((testController) => {
      testController.moveNodeByID('Constant3', 0, -100);
      testController.moveNodeByID('Constant4', 230, -100);
      testController.connectNodesByID('Constant3', 'Constant4', 'Out', 'In');
    });
    cy.wait(100);
    doWithTestController((testController) => {
      const [startX, startY] =
        testController.getSocketCenterByNodeIDAndSocketName('Constant1', 'Out');
      const [endX, endY] = testController.getSocketCenterByNodeIDAndSocketName(
        'Constant4',
        'In',
      );
      dragFromAtoB(startX, startY, endX, endY, true);
    });
    doWithTestController((testController) => {
      expect(
        testController.getSocketLinks('Constant4', 'In')[0].source.getNode().id,
      ).to.eq('Constant1');
      expect(testController.getSocketLinks('Constant1', 'Out').length).to.eq(2);
      expect(testController.getSocketLinks('Constant3', 'Out').length).to.eq(0);
    });
  });

  it('Does nothing on clicking connected output socket without or minimal dragging', () => {
    const moveX = 5;
    const moveY = 5;

    doWithTestController((testController) => {
      const [startX, startY] =
        testController.getSocketCenterByNodeIDAndSocketName('Constant1', 'Out');
      dragFromAtoB(startX, startY, startX + moveX, startY + moveY, true);
    });
    doWithTestController((testController) => {
      expect(
        testController.getSocketLinks('Constant2', 'In')[0].source.getNode().id,
      ).to.eq('Constant1');
      cy.get('#node-search[placeholder*="Search nodes"]').should(
        'not.be.visible',
      );
    });
  });

  // Input socket with no connection
  it('Opens node browser on dragging from unconnected input socket to graph', () => {
    doWithTestController((testController) => {
      expect(testController.addNode('Constant', 'Constant4')).to.eq(true);
    });
    cy.wait(100);
    doWithTestController((testController) => {
      testController.moveNodeByID('Constant4', 230, -100);
    });
    cy.wait(100);
    doWithTestController((testController) => {
      const [startX, startY] =
        testController.getSocketCenterByNodeIDAndSocketName('Constant4', 'In');
      dragFromAtoB(startX, startY, startX - 100, startY, true);
    });
    cy.wait(1000);
    doWithTestController((testController) => {
      cy.get('#node-search[placeholder*="Search nodes"]').should('be.visible');
    });
  });

  it('Creates a connection to preferred socket on dragging from unconnected input socket to node', () => {
    doWithTestController((testController) => {
      expect(testController.addNode('Constant', 'Constant3')).to.eq(true);
      expect(testController.addNode('Constant', 'Constant4')).to.eq(true);
    });
    cy.wait(100);
    doWithTestController((testController) => {
      testController.moveNodeByID('Constant3', 0, -100);
      testController.moveNodeByID('Constant4', 230, -100);
    });
    cy.wait(100);
    doWithTestController((testController) => {
      const [startX, startY] =
        testController.getSocketCenterByNodeIDAndSocketName('Constant4', 'In');
      const [endX, endY] = testController.getNodeCenterById('Constant3');
      dragFromAtoB(startX, startY, endX, endY, true);
    });
    doWithTestController((testController) => {
      expect(
        testController.getSocketLinks('Constant4', 'In')[0].source.getNode().id,
      ).to.eq('Constant3');
    });
  });

  it('Creates a connection on dragging from unconnected input socket to output socket without a connection', () => {
    doWithTestController((testController) => {
      expect(testController.addNode('Constant', 'Constant3')).to.eq(true);
      expect(testController.addNode('Constant', 'Constant4')).to.eq(true);
    });
    cy.wait(100);
    doWithTestController((testController) => {
      testController.moveNodeByID('Constant3', 0, -100);
      testController.moveNodeByID('Constant4', 230, -100);
    });
    cy.wait(100);
    doWithTestController((testController) => {
      const [startX, startY] =
        testController.getSocketCenterByNodeIDAndSocketName('Constant4', 'In');
      const [endX, endY] = testController.getSocketCenterByNodeIDAndSocketName(
        'Constant3',
        'Out',
      );
      dragFromAtoB(startX, startY, endX, endY, true);
    });
    doWithTestController((testController) => {
      expect(
        testController.getSocketLinks('Constant4', 'In')[0].source.getNode().id,
      ).to.eq('Constant3');
    });
  });

  it('Creates a connection on dragging from unconnected input socket to output socket with a connection', () => {
    doWithTestController((testController) => {
      expect(testController.addNode('Constant', 'Constant4')).to.eq(true);
    });
    cy.wait(100);
    doWithTestController((testController) => {
      testController.moveNodeByID('Constant4', 230, -100);
    });
    cy.wait(100);
    doWithTestController((testController) => {
      const [startX, startY] =
        testController.getSocketCenterByNodeIDAndSocketName('Constant4', 'In');
      const [endX, endY] = testController.getSocketCenterByNodeIDAndSocketName(
        'Constant1',
        'Out',
      );
      dragFromAtoB(startX, startY, endX, endY, true);
    });
    doWithTestController((testController) => {
      expect(
        testController.getSocketLinks('Constant4', 'In')[0].source.getNode().id,
      ).to.eq('Constant1');
      expect(testController.getSocketLinks('Constant1', 'Out').length).to.eq(2);
    });
  });

  it('Does nothing on clicking unconnected input socket without or minimal dragging', () => {
    const moveX = -5;
    const moveY = -5;

    doWithTestController((testController) => {
      expect(testController.addNode('Constant', 'Constant3')).to.eq(true);
    });
    cy.wait(100);
    doWithTestController((testController) => {
      testController.moveNodeByID('Constant3', 0, -100);
    });
    doWithTestController((testController) => {
      const [startX, startY] =
        testController.getSocketCenterByNodeIDAndSocketName('Constant3', 'In');
      dragFromAtoB(startX, startY, startX + moveX, startY + moveY, true);
    });
    cy.get('#node-search[placeholder*="Search nodes"]').should(
      'not.be.visible',
    );
  });

  // Input socket with connection
  it('Removes connection on dragging from connected input socket to graph', () => {
    const endX = 660;
    const endY = 200;

    doWithTestController((testController) => {
      const [startX, startY] =
        testController.getSocketCenterByNodeIDAndSocketName('Constant2', 'In');
      dragFromAtoB(startX, startY, endX, endY, true);
    });
    doWithTestController((testController) => {
      cy.get('#node-search[placeholder*="Search nodes"]').should(
        'not.be.visible',
      );
      expect(testController.getSocketLinks('Constant1', 'Out').length).to.eq(0);
      expect(testController.getSocketLinks('Constant2', 'In').length).to.eq(0);
    });
  });

  it('Moves connection to preferred socket on dragging from connected input socket to node', () => {
    doWithTestController((testController) => {
      expect(testController.addNode('Constant', 'Constant4')).to.eq(true);
    });
    cy.wait(100);
    doWithTestController((testController) => {
      testController.moveNodeByID('Constant4', 230, -100);
    });
    cy.wait(100);
    doWithTestController((testController) => {
      const [startX, startY] =
        testController.getSocketCenterByNodeIDAndSocketName('Constant2', 'In');
      const [endX, endY] = testController.getNodeCenterById('Constant4');
      dragFromAtoB(startX, startY, endX, endY, true);
    });
    doWithTestController((testController) => {
      expect(
        testController.getSocketLinks('Constant4', 'In')[0].source.getNode().id,
      ).to.eq('Constant1');
      expect(testController.getSocketLinks('Constant2', 'In').length).to.eq(0);
    });
  });

  it('Moves connection on dragging from connected input socket to output socket without a connection', () => {
    doWithTestController((testController) => {
      expect(testController.addNode('Constant', 'Constant4')).to.eq(true);
    });
    cy.wait(100);
    doWithTestController((testController) => {
      testController.moveNodeByID('Constant4', 230, -100);
    });
    cy.wait(100);
    doWithTestController((testController) => {
      const [startX, startY] =
        testController.getSocketCenterByNodeIDAndSocketName('Constant2', 'In');
      const [endX, endY] = testController.getSocketCenterByNodeIDAndSocketName(
        'Constant4',
        'In',
      );
      dragFromAtoB(startX, startY, endX, endY, true);
    });
    doWithTestController((testController) => {
      expect(
        testController.getSocketLinks('Constant4', 'In')[0].source.getNode().id,
      ).to.eq('Constant1');
      expect(testController.getSocketLinks('Constant2', 'In').length).to.eq(0);
    });
  });

  it('Moves connection and removes previous one on dragging from connected input socket to output socket with a connection', () => {
    doWithTestController((testController) => {
      expect(testController.addNode('Constant', 'Constant3')).to.eq(true);
      expect(testController.addNode('Constant', 'Constant4')).to.eq(true);
    });
    cy.wait(100);
    doWithTestController((testController) => {
      testController.moveNodeByID('Constant3', 0, -100);
      testController.moveNodeByID('Constant4', 230, -100);
      testController.connectNodesByID('Constant3', 'Constant4', 'Out', 'In');
    });
    cy.wait(100);
    doWithTestController((testController) => {
      const [startX, startY] =
        testController.getSocketCenterByNodeIDAndSocketName('Constant2', 'In');
      const [endX, endY] = testController.getSocketCenterByNodeIDAndSocketName(
        'Constant4',
        'In',
      );
      dragFromAtoB(startX, startY, endX, endY, true);
    });
    doWithTestController((testController) => {
      expect(
        testController.getSocketLinks('Constant4', 'In')[0].source.getNode().id,
      ).to.eq('Constant1');
      expect(testController.getSocketLinks('Constant2', 'In').length).to.eq(0);
      expect(testController.getSocketLinks('Constant3', 'In').length).to.eq(0);
    });
  });

  it('Removes connection on dragging from connected input socket to output socket without a connection', () => {
    doWithTestController((testController) => {
      expect(testController.addNode('Constant', 'Constant3')).to.eq(true);
    });
    cy.wait(100);
    doWithTestController((testController) => {
      testController.moveNodeByID('Constant3', 0, -100);
    });
    cy.wait(100);
    doWithTestController((testController) => {
      const [startX, startY] =
        testController.getSocketCenterByNodeIDAndSocketName('Constant2', 'In');
      const [endX, endY] = testController.getSocketCenterByNodeIDAndSocketName(
        'Constant3',
        'Out',
      );
      dragFromAtoB(startX, startY, endX, endY, true);
    });
    doWithTestController((testController) => {
      expect(testController.getSocketLinks('Constant3', 'Out').length).to.eq(0);
      expect(testController.getSocketLinks('Constant2', 'In').length).to.eq(0);
      expect(testController.getSocketLinks('Constant1', 'Out').length).to.eq(0);
    });
  });

  it('Removes connection on dragging from connected input socket to output socket with a connection', () => {
    doWithTestController((testController) => {
      expect(testController.addNode('Constant', 'Constant3')).to.eq(true);
      expect(testController.addNode('Constant', 'Constant4')).to.eq(true);
    });
    cy.wait(100);
    doWithTestController((testController) => {
      testController.moveNodeByID('Constant3', 0, -100);
      testController.moveNodeByID('Constant4', 230, -100);
      testController.connectNodesByID('Constant3', 'Constant4', 'Out', 'In');
    });
    cy.wait(100);
    doWithTestController((testController) => {
      const [startX, startY] =
        testController.getSocketCenterByNodeIDAndSocketName('Constant2', 'In');
      const [endX, endY] = testController.getSocketCenterByNodeIDAndSocketName(
        'Constant3',
        'Out',
      );
      dragFromAtoB(startX, startY, endX, endY, true);
    });
    doWithTestController((testController) => {
      expect(
        testController.getSocketLinks('Constant4', 'In')[0].source.getNode().id,
      ).to.eq('Constant3');
      expect(testController.getSocketLinks('Constant2', 'In').length).to.eq(0);
      expect(testController.getSocketLinks('Constant1', 'Out').length).to.eq(0);
    });
  });

  it('Does nothing on clicking connected input socket without or minimal dragging', () => {
    const moveX = -5;
    const moveY = -5;

    doWithTestController((testController) => {
      const [startX, startY] =
        testController.getSocketCenterByNodeIDAndSocketName('Constant2', 'In');
      dragFromAtoB(startX, startY, startX + moveX, startY + moveY, true);
    });
    cy.wait(1000);
    doWithTestController((testController) => {
      cy.get('#node-search[placeholder*="Search nodes"]').should(
        'not.be.visible',
      );
      expect(testController.getSocketLinks('Constant1', 'Out').length).to.eq(1);
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
