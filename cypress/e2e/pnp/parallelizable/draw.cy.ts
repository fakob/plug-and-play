import {  doWithTestController, openExistingGraph, openNewGraph, saveGraph, } from '../helpers';

describe('draw', () => {
  it('add draw shape and multiply nodes, connect them', () => {
    openNewGraph();

    doWithTestController(async (testController) => {
      await testController.addNode('DRAW_Shape', 'DRAW_Shape');
      await testController.addNode('DRAW_Multiplier', 'DRAW_Multiplier');
      await testController.moveNodeByID('DRAW_Multiplier', 200, 0);
      await testController.connectNodesByID(
        'DRAW_Shape',
        'DRAW_Multiplier',
        'Graphics');
      await testController.addNode("DRAW_Image", "DRAW_Image", 0, -200);
      await testController.addNode("DRAW_Combine", "DRAW_Combine", 200,-200);
      await testController.connectNodesByID("DRAW_Image", "DRAW_Combine");
      },
     "addinitialnodes");
  });

});
