import {  doWithTestController, openExistingGraph, openNewGraph, saveGraph, } from '../helpers';

describe('draw', () => {
  it('add draw shape and multiply nodes, connect them', () => {
    openNewGraph();

    doWithTestController(async (testController) => {
      await testController.addNode('DRAW_Shape', 'DRAW_Shape');
      await testController.addNode('DRAW_Multiplier', 'DRAW_Multiplier');
    }, "addinitialnodes");
    doWithTestController(async (testController) => {
      await testController.moveNodeByID('DRAW_Multiplier', 200, 0);
      await testController.connectNodesByID(
        'DRAW_Shape',
        'DRAW_Multiplier',
        'Graphics',
      );
    }, "movenodes");
  });

  it('save the graph', () => {
    saveGraph();
  });

  it('open it again, see that everything is still there', () => {
    openExistingGraph();
    doWithTestController((testController) => {
      expect(testController.getNodes().length).to.eq(2);
    });
  });
});
