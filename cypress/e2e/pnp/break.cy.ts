import { controlOrMetaKey, doWithTestController, saveGraph } from './helpers';

describe('break', () => {
  it('add break nodes', () => {
    cy.visit('http://127.0.0.1:8080/?new=true');
    cy.wait(100);
    doWithTestController((testController) => {
      testController.addNode('Constant', 'Constant');
      testController.addNode('Break', 'Break');

      testController.addNode('Constant', 'Constant2');
      testController.addNode('Break', 'Break2');
    });
  });

  it('arrange them', () => {
    cy.wait(100);
    doWithTestController((testController) => {
      testController.moveNodeByID('Break', 200, 0);
      testController.moveNodeByID('Break2', 200, -200);
      testController.moveNodeByID('Constant2', 0, -200);
    });
  });

  it('try a massive break node input, see that it results in 100 output sockets', () => {
    doWithTestController((testController) => {
      const breakInput = {};
      for (let i = 0; i < 10000; i++) {
        breakInput[i.toString()] = i;
      }
      testController.setNodeInputValue('Break', 'JSON', breakInput);
      testController.setNodeInputValue("Constant2", "In",{first:{second:"hello"}});
      testController.executeNodeByID('Break');
    });

    cy.wait(100);
    doWithTestController((testController) => {
      expect(testController.getOutputSockets('Break').length).to.eq(100);
    });
  });

  it('try very nested JSON, save', () => {
    const base = {};
    let current = base;
    for (let i = 0; i < 100; i++) {
      const next = { a: {} };
      current['c'] = 'hello';
      current['d'] = 1;
      current['b'] = next;
      current = next;
    }
    doWithTestController((testController) => {
      testController.setNodeInputValue('Break', 'JSON', base);
      testController.executeNodeByID('Break');
    });
    cy.wait(100);
    doWithTestController((testController) => {
      // see that we get an object out
      expect(typeof testController.getNodeOutputValue('Break', 'b')).to.eq(
        'object',
      );
    });
  });

  it('connect links', () => {
    doWithTestController((testController) => {
      testController.connectNodesByID('Constant', 'Break', 'Out');
      testController.connectNodesByID('Constant2', 'Break2', 'Out');

    });
  });

  // at some point there was a bug where the links disconnected when source nodes executed, so this should test for that
  it ("execute the source nodes", () => {
    cy.wait(100);
    doWithTestController((testController) => {
      testController.executeNodeByID("Constant2");
    });

  });

  it ("check the arrow json value is still cool and connected", () => {
    cy.wait(200);
    doWithTestController((testController) => {
      expect(testController.getNodeOutputValue("Break2", "first→second")).to.eq("hello");
      expect(testController.getSocketLinks("Break2", "JSON").length).to.eq(1);
    });
  })

  it("save graph", () => {
    saveGraph();
    cy.wait(100);
  });

  it("add another one", () => {

  });

  it('load it again', () => {
    cy.visit('http://127.0.0.1:8080');

    cy.wait(3000);
    doWithTestController((testController) => {
      // see that we get an object out
      expect(testController.getNodes().length).to.eq(4);
    });
  });
});
