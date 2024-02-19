import { controlOrMetaKey, doWithTestController, openExistingGraph, openNewGraph, saveGraph, waitForGraphToBeLoaded } from '../helpers';

describe('break', () => {
  it('add break nodes', () => {
    openNewGraph();
    doWithTestController(async (testController) => {
      await testController.addNode('Constant', 'Constant');
      await testController.addNode('Break', 'Break');

      await testController.addNode('Constant', 'Constant2');
      await testController.addNode('Break', 'Break2');
    }, "addnodes");
  });

  it('arrange them', () => {
    doWithTestController((testController) => {
      testController.moveNodeByID('Break', 200, 0);
      testController.moveNodeByID('Break2', 200, -200);
      testController.moveNodeByID('Constant2', 0, -200);
    });
  });

  it('try a massive break node input, see that it results in 100 output sockets', () => {
    doWithTestController(async (testController) => {
      const breakInput = {};
      for (let i = 0; i < 10000; i++) {
        breakInput[i.toString()] = i;
      }
      testController.setNodeInputValue('Break', 'JSON', breakInput);
      testController.setNodeInputValue("Constant2", "In",{first:{second:"hello"}});
      await testController.executeNodeByID('Break');
    }, "setInput");

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
    doWithTestController(async (testController) => {
      testController.setNodeInputValue('Break', 'JSON', base);
      await testController.executeNodeByID('Break');
    }, "setNestedInput");
    doWithTestController((testController) => {
      // see that we get an object out
      expect(typeof testController.getNodeOutputValue('Break', 'b')).to.eq(
        'object',
      );
    });
  });

  it('connect links', () => {
    doWithTestController(async (testController) => {
      await testController.connectNodesByID('Constant', 'Break', 'Out');
      await testController.connectNodesByID('Constant2', 'Break2', 'Out');
    }, "connectnodes");
  });

  // at some point there was a bug where the links disconnected when source nodes executed, so this should test for that
  it ("execute the source nodes", () => {
    doWithTestController(async (testController) => {
      await testController.executeNodeByID("Constant2");
    }, "executesourcenode");
  });

  it ("check the arrow json value is still cool and connected", () => {
    doWithTestController((testController) => {
      expect(testController.getNodeOutputValue("Break2", "first→second")).to.eq("hello");
      expect(testController.getSocketLinks("Break2", "JSON").length).to.eq(1);
    });
  })

  it("save graph", () => {
    saveGraph();
  });

  it('load it again', () => {
    openExistingGraph();
    doWithTestController((testController) => {
      // see that we get an object out
      expect(testController.getNodes().length).to.eq(4);
    });
  });
});
