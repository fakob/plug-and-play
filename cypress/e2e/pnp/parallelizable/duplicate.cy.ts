import {  doWithTestController, openExistingGraph, openNewGraph, saveGraph, } from '../helpers';

describe('duplicate', () => {
  it('try duplicating a draw image node', () => {
    openNewGraph();
    doWithTestController(async testController => {
      await testController.addNode("DRAW_Image", "DRAW_Image");
      testController.selectNodesById(["DRAW_Image"]);
      await testController.duplicateSelection();
    });
  });
});
