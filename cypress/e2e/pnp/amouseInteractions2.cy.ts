import {
  addTwoNodes,
  afterEachMouseInteraction,
  beforeEachMouseInteraction,
  doWithTestController,
  dragFromAtoB,
  moveTwoNodes,
} from './helpers';

describe('mouseInteractions2', () => {
  beforeEach(() => {
    beforeEachMouseInteraction();
  });

  afterEach(() => {
    afterEachMouseInteraction();
  });

  // Output socket with no connection
  // it('Opens node browser on dragging from unconnected output socket to graph', () => {
  //   const endX = 460;
  //   const endY = 150;

  //   doWithTestController((testController) => {
  //     const [startX, startY] =
  //       testController.getSocketCenterByNodeIDAndSocketName('Constant2', 'Out');
  //     dragFromAtoB(startX, startY, endX, endY, true);
  //     cy.get('body').realMouseUp(); // tests occasionally fail as the first mouse up is not registered
  //   });
  //   cy.wait(2000);
  //   cy.get('#node-search[placeholder*="Search nodes"]').should('be.visible');
  //   cy.get('#node-search[placeholder*="Search nodes"]').type('{enter}');
  //   cy.wait(100);
  //   doWithTestController((testController) => {
  //     expect(testController.getNodes().length).to.eq(3);
  //   });
  // });

  // it('Creates a connection to preferred socket on dragging from unconnected output socket to node', () => {
  //   addTwoNodes();
  //   moveTwoNodes();
  //   doWithTestController((testController) => {
  //     const [startX, startY] =
  //       testController.getSocketCenterByNodeIDAndSocketName('Constant3', 'Out');
  //     const [endX, endY] = testController.getNodeCenterById('Constant4');
  //     dragFromAtoB(startX, startY, endX, endY, true);
  //   });
  //   doWithTestController((testController) => {
  //     expect(
  //       testController.getSocketLinks('Constant4', 'In')[0].source.getNode().id,
  //     ).to.eq('Constant3');
  //   });
  // });

  // it('Creates a connection on dragging from unconnected output socket to input socket without a connection', () => {
  //   addTwoNodes();
  //   moveTwoNodes();
  //   doWithTestController((testController) => {
  //     const [startX, startY] =
  //       testController.getSocketCenterByNodeIDAndSocketName('Constant3', 'Out');
  //     const [endX, endY] = testController.getSocketCenterByNodeIDAndSocketName(
  //       'Constant4',
  //       'In',
  //     );
  //     dragFromAtoB(startX, startY, endX, endY, true);
  //   });
  //   doWithTestController((testController) => {
  //     expect(
  //       testController.getSocketLinks('Constant4', 'In')[0].source.getNode().id,
  //     ).to.eq('Constant3');
  //   });
  // });

  // it('Creates a connection and removes previous one on dragging from unconnected output socket to input socket with a connection', () => {
  //   doWithTestController((testController) => {
  //     expect(
  //       testController.getSocketLinks('Constant2', 'In')[0].source.getNode().id,
  //     ).to.eq('Constant1');
  //     expect(testController.addNode('Constant', 'Constant3')).to.eq(true);
  //     cy.wait(100);
  //   });
  //   doWithTestController((testController) => {
  //     testController.moveNodeByID('Constant3', 0, -100);
  //   });
  //   cy.wait(100);
  //   doWithTestController((testController) => {
  //     const [startX, startY] =
  //       testController.getSocketCenterByNodeIDAndSocketName('Constant3', 'Out');
  //     const [endX, endY] = testController.getSocketCenterByNodeIDAndSocketName(
  //       'Constant2',
  //       'In',
  //     );
  //     dragFromAtoB(startX, startY, endX, endY, true);
  //   });
  //   doWithTestController((testController) => {
  //     expect(
  //       testController.getSocketLinks('Constant2', 'In')[0].source.getNode().id,
  //     ).to.eq('Constant3');
  //   });
  // });

  // it('Does nothing on clicking unconnected output socket without or minimal dragging', () => {
  //   const moveX = 5;
  //   const moveY = 5;

  //   doWithTestController((testController) => {
  //     expect(testController.addNode('Constant', 'Constant3')).to.eq(true);
  //   });
  //   cy.wait(100);
  //   doWithTestController((testController) => {
  //     testController.moveNodeByID('Constant3', 0, -100);
  //   });
  //   doWithTestController((testController) => {
  //     const [startX, startY] =
  //       testController.getSocketCenterByNodeIDAndSocketName('Constant3', 'Out');
  //     dragFromAtoB(startX, startY, startX + moveX, startY + moveY, true);
  //   });
  //   cy.get('#node-search[placeholder*="Search nodes"]').should(
  //     'not.be.visible',
  //   );
  // });

  // // Output socket with connection
  // it('Opens node browser on dragging from connected output socket to graph', () => {
  //   const endX = 460;
  //   const endY = 150;

  //   doWithTestController((testController) => {
  //     const [startX, startY] =
  //       testController.getSocketCenterByNodeIDAndSocketName('Constant1', 'Out');
  //     dragFromAtoB(startX, startY, endX, endY, true);
  //     cy.get('body').realMouseUp(); // tests occasionally fail as the first mouse up is not registered
  //   });
  //   cy.wait(2000);
  //   cy.get('#node-search[placeholder*="Search nodes"]').should('be.visible');
  //   cy.get('#node-search[placeholder*="Search nodes"]').type('{enter}');
  //   doWithTestController((testController) => {
  //     expect(testController.getNodes().length).to.eq(3);
  //   });
  // });

  // it('Creates a connection to preferred socket on dragging from connected output socket to node', () => {
  //   doWithTestController((testController) => {
  //     expect(testController.addNode('Constant', 'Constant4')).to.eq(true);
  //   });
  //   cy.wait(100);
  //   doWithTestController((testController) => {
  //     testController.moveNodeByID('Constant4', 230, -100);
  //   });
  //   cy.wait(100);
  //   doWithTestController((testController) => {
  //     const [startX, startY] =
  //       testController.getSocketCenterByNodeIDAndSocketName('Constant1', 'Out');
  //     const [endX, endY] = testController.getNodeCenterById('Constant4');
  //     dragFromAtoB(startX, startY, endX, endY, true);
  //   });
  //   doWithTestController((testController) => {
  //     expect(
  //       testController.getSocketLinks('Constant4', 'In')[0].source.getNode().id,
  //     ).to.eq('Constant1');
  //   });
  // });

  // it('Creates a connection on dragging from connected output socket to input socket without a connection', () => {
  //   doWithTestController((testController) => {
  //     expect(testController.addNode('Constant', 'Constant4')).to.eq(true);
  //   });
  //   cy.wait(100);
  //   doWithTestController((testController) => {
  //     testController.moveNodeByID('Constant4', 230, -100);
  //   });
  //   cy.wait(100);
  //   doWithTestController((testController) => {
  //     const [startX, startY] =
  //       testController.getSocketCenterByNodeIDAndSocketName('Constant1', 'Out');
  //     const [endX, endY] = testController.getSocketCenterByNodeIDAndSocketName(
  //       'Constant4',
  //       'In',
  //     );
  //     dragFromAtoB(startX, startY, endX, endY, true);
  //   });
  //   doWithTestController((testController) => {
  //     expect(
  //       testController.getSocketLinks('Constant4', 'In')[0].source.getNode().id,
  //     ).to.eq('Constant1');
  //   });
  // });

  // it('Creates a connection on dragging from connected output socket to input socket with a connection', () => {
  //   addTwoNodes();
  //   moveTwoNodes();
  //   doWithTestController((testController) => {
  //     testController.connectNodesByID('Constant3', 'Constant4', 'Out', 'In');
  //   });
  //   cy.wait(100);
  //   doWithTestController((testController) => {
  //     const [startX, startY] =
  //       testController.getSocketCenterByNodeIDAndSocketName('Constant1', 'Out');
  //     const [endX, endY] = testController.getSocketCenterByNodeIDAndSocketName(
  //       'Constant4',
  //       'In',
  //     );
  //     dragFromAtoB(startX, startY, endX, endY, true);
  //   });
  //   doWithTestController((testController) => {
  //     expect(
  //       testController.getSocketLinks('Constant4', 'In')[0].source.getNode().id,
  //     ).to.eq('Constant1');
  //     expect(testController.getSocketLinks('Constant1', 'Out').length).to.eq(2);
  //     expect(testController.getSocketLinks('Constant3', 'Out').length).to.eq(0);
  //   });
  // });

  // it('Does nothing on clicking connected output socket without or minimal dragging', () => {
  //   const moveX = 5;
  //   const moveY = 5;

  //   doWithTestController((testController) => {
  //     const [startX, startY] =
  //       testController.getSocketCenterByNodeIDAndSocketName('Constant1', 'Out');
  //     dragFromAtoB(startX, startY, startX + moveX, startY + moveY, true);
  //   });
  //   doWithTestController((testController) => {
  //     expect(
  //       testController.getSocketLinks('Constant2', 'In')[0].source.getNode().id,
  //     ).to.eq('Constant1');
  //     cy.get('#node-search[placeholder*="Search nodes"]').should(
  //       'not.be.visible',
  //     );
  //   });
  // });

  // // Input socket with no connection
  // it('Opens node browser on dragging from unconnected input socket to graph', () => {
  //   doWithTestController((testController) => {
  //     expect(testController.addNode('Constant', 'Constant4')).to.eq(true);
  //   });
  //   cy.wait(100);
  //   doWithTestController((testController) => {
  //     testController.moveNodeByID('Constant4', 230, -100);
  //   });
  //   cy.wait(100);
  //   doWithTestController((testController) => {
  //     const [startX, startY] =
  //       testController.getSocketCenterByNodeIDAndSocketName('Constant4', 'In');
  //     dragFromAtoB(startX, startY, startX - 150, startY - 200, true);
  //     cy.get('body').realMouseUp(); // tests occasionally fail as the first mouse up is not registered
  //   });
  //   cy.wait(2000);
  //   doWithTestController((testController) => {
  //     cy.get('#node-search[placeholder*="Search nodes"]').should('be.visible');
  //   });
  // });

  // it('Creates a connection to preferred socket on dragging from unconnected input socket to node', () => {
  //   addTwoNodes();
  //   moveTwoNodes();
  //   doWithTestController((testController) => {
  //     const [startX, startY] =
  //       testController.getSocketCenterByNodeIDAndSocketName('Constant4', 'In');
  //     const [endX, endY] = testController.getNodeCenterById('Constant3');
  //     dragFromAtoB(startX, startY, endX, endY, true);
  //   });
  //   doWithTestController((testController) => {
  //     expect(
  //       testController.getSocketLinks('Constant4', 'In')[0].source.getNode().id,
  //     ).to.eq('Constant3');
  //   });
  // });

  // it('Creates a connection on dragging from unconnected input socket to output socket without a connection', () => {
  //   addTwoNodes();
  //   moveTwoNodes();
  //   doWithTestController((testController) => {
  //     const [startX, startY] =
  //       testController.getSocketCenterByNodeIDAndSocketName('Constant4', 'In');
  //     const [endX, endY] = testController.getSocketCenterByNodeIDAndSocketName(
  //       'Constant3',
  //       'Out',
  //     );
  //     dragFromAtoB(startX, startY, endX, endY, true);
  //   });
  //   doWithTestController((testController) => {
  //     expect(
  //       testController.getSocketLinks('Constant4', 'In')[0].source.getNode().id,
  //     ).to.eq('Constant3');
  //   });
  // });

  // it('Creates a connection on dragging from unconnected input socket to output socket with a connection', () => {
  //   doWithTestController((testController) => {
  //     expect(testController.addNode('Constant', 'Constant4')).to.eq(true);
  //   });
  //   cy.wait(100);
  //   doWithTestController((testController) => {
  //     testController.moveNodeByID('Constant4', 230, -100);
  //   });
  //   cy.wait(100);
  //   doWithTestController((testController) => {
  //     const [startX, startY] =
  //       testController.getSocketCenterByNodeIDAndSocketName('Constant4', 'In');
  //     const [endX, endY] = testController.getSocketCenterByNodeIDAndSocketName(
  //       'Constant1',
  //       'Out',
  //     );
  //     dragFromAtoB(startX, startY, endX, endY, true);
  //   });
  //   doWithTestController((testController) => {
  //     expect(
  //       testController.getSocketLinks('Constant4', 'In')[0].source.getNode().id,
  //     ).to.eq('Constant1');
  //     expect(testController.getSocketLinks('Constant1', 'Out').length).to.eq(2);
  //   });
  // });

  // it('Does nothing on clicking unconnected input socket without or minimal dragging', () => {
  //   const moveX = -5;
  //   const moveY = -5;

  //   doWithTestController((testController) => {
  //     expect(testController.addNode('Constant', 'Constant3')).to.eq(true);
  //   });
  //   cy.wait(100);
  //   doWithTestController((testController) => {
  //     testController.moveNodeByID('Constant3', 0, -100);
  //   });
  //   doWithTestController((testController) => {
  //     const [startX, startY] =
  //       testController.getSocketCenterByNodeIDAndSocketName('Constant3', 'In');
  //     dragFromAtoB(startX, startY, startX + moveX, startY + moveY, true);
  //   });
  //   cy.get('#node-search[placeholder*="Search nodes"]').should(
  //     'not.be.visible',
  //   );
  // });

  // // Input socket with connection
  // it('Removes connection on dragging from connected input socket to graph', () => {
  //   const endX = 660;
  //   const endY = 200;

  //   doWithTestController((testController) => {
  //     const [startX, startY] =
  //       testController.getSocketCenterByNodeIDAndSocketName('Constant2', 'In');
  //     dragFromAtoB(startX, startY, endX, endY, true);
  //   });
  //   doWithTestController((testController) => {
  //     cy.get('#node-search[placeholder*="Search nodes"]').should(
  //       'not.be.visible',
  //     );
  //     expect(testController.getSocketLinks('Constant1', 'Out').length).to.eq(0);
  //     expect(testController.getSocketLinks('Constant2', 'In').length).to.eq(0);
  //   });
  // });

  // it('Moves connection to preferred socket on dragging from connected input socket to node', () => {
  //   doWithTestController((testController) => {
  //     expect(testController.addNode('Constant', 'Constant4')).to.eq(true);
  //   });
  //   cy.wait(100);
  //   doWithTestController((testController) => {
  //     testController.moveNodeByID('Constant4', 230, -100);
  //   });
  //   cy.wait(100);
  //   doWithTestController((testController) => {
  //     const [startX, startY] =
  //       testController.getSocketCenterByNodeIDAndSocketName('Constant2', 'In');
  //     const [endX, endY] = testController.getNodeCenterById('Constant4');
  //     dragFromAtoB(startX, startY, endX, endY, true);
  //   });
  //   doWithTestController((testController) => {
  //     expect(
  //       testController.getSocketLinks('Constant4', 'In')[0].source.getNode().id,
  //     ).to.eq('Constant1');
  //     expect(testController.getSocketLinks('Constant2', 'In').length).to.eq(0);
  //   });
  // });

  // it('Moves connection on dragging from connected input socket to output socket without a connection', () => {
  //   doWithTestController((testController) => {
  //     expect(testController.addNode('Constant', 'Constant4')).to.eq(true);
  //   });
  //   cy.wait(100);
  //   doWithTestController((testController) => {
  //     testController.moveNodeByID('Constant4', 230, -100);
  //   });
  //   cy.wait(100);
  //   doWithTestController((testController) => {
  //     const [startX, startY] =
  //       testController.getSocketCenterByNodeIDAndSocketName('Constant2', 'In');
  //     const [endX, endY] = testController.getSocketCenterByNodeIDAndSocketName(
  //       'Constant4',
  //       'In',
  //     );
  //     dragFromAtoB(startX, startY, endX, endY, true);
  //   });
  //   doWithTestController((testController) => {
  //     expect(
  //       testController.getSocketLinks('Constant4', 'In')[0].source.getNode().id,
  //     ).to.eq('Constant1');
  //     expect(testController.getSocketLinks('Constant2', 'In').length).to.eq(0);
  //   });
  // });

  // it('Moves connection and removes previous one on dragging from connected input socket to output socket with a connection', () => {
  //   addTwoNodes();
  //   moveTwoNodes();
  //   doWithTestController((testController) => {
  //     testController.connectNodesByID('Constant3', 'Constant4', 'Out', 'In');
  //   });
  //   cy.wait(100);
  //   doWithTestController((testController) => {
  //     const [startX, startY] =
  //       testController.getSocketCenterByNodeIDAndSocketName('Constant2', 'In');
  //     const [endX, endY] = testController.getSocketCenterByNodeIDAndSocketName(
  //       'Constant4',
  //       'In',
  //     );
  //     dragFromAtoB(startX, startY, endX, endY, true);
  //   });
  //   doWithTestController((testController) => {
  //     expect(
  //       testController.getSocketLinks('Constant4', 'In')[0].source.getNode().id,
  //     ).to.eq('Constant1');
  //     expect(testController.getSocketLinks('Constant2', 'In').length).to.eq(0);
  //     expect(testController.getSocketLinks('Constant3', 'In').length).to.eq(0);
  //   });
  // });

  // it('Removes connection on dragging from connected input socket to output socket without a connection', () => {
  //   doWithTestController((testController) => {
  //     expect(testController.addNode('Constant', 'Constant3')).to.eq(true);
  //   });
  //   cy.wait(100);
  //   doWithTestController((testController) => {
  //     testController.moveNodeByID('Constant3', 0, -100);
  //   });
  //   cy.wait(100);
  //   doWithTestController((testController) => {
  //     const [startX, startY] =
  //       testController.getSocketCenterByNodeIDAndSocketName('Constant2', 'In');
  //     const [endX, endY] = testController.getSocketCenterByNodeIDAndSocketName(
  //       'Constant3',
  //       'Out',
  //     );
  //     dragFromAtoB(startX, startY, endX, endY, true);
  //   });
  //   doWithTestController((testController) => {
  //     expect(testController.getSocketLinks('Constant3', 'Out').length).to.eq(0);
  //     expect(testController.getSocketLinks('Constant2', 'In').length).to.eq(0);
  //     expect(testController.getSocketLinks('Constant1', 'Out').length).to.eq(0);
  //   });
  // });

  // it('Removes connection on dragging from connected input socket to output socket with a connection', () => {
  //   addTwoNodes();
  //   moveTwoNodes();
  //   doWithTestController((testController) => {
  //     testController.connectNodesByID('Constant3', 'Constant4', 'Out', 'In');
  //   });
  //   cy.wait(100);
  //   doWithTestController((testController) => {
  //     const [startX, startY] =
  //       testController.getSocketCenterByNodeIDAndSocketName('Constant2', 'In');
  //     const [endX, endY] = testController.getSocketCenterByNodeIDAndSocketName(
  //       'Constant3',
  //       'Out',
  //     );
  //     dragFromAtoB(startX, startY, endX, endY, true);
  //   });
  //   doWithTestController((testController) => {
  //     expect(
  //       testController.getSocketLinks('Constant4', 'In')[0].source.getNode().id,
  //     ).to.eq('Constant3');
  //     expect(testController.getSocketLinks('Constant2', 'In').length).to.eq(0);
  //     expect(testController.getSocketLinks('Constant1', 'Out').length).to.eq(0);
  //   });
  // });

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
});
