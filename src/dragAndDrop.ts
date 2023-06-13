import * as PIXI from 'pixi.js';
import InterfaceController from './InterfaceController';
import PPStorage from './PPStorage';
import PPGraph from './classes/GraphClass';
import PPNode from './classes/NodeClass';
import { DRAGANDDROP_GRID_MARGIN, PXSHOW_SQL_QUERY } from './utils/constants';
import { convertBlobToBase64 } from './utils/utils';
import { ensureVisible } from './pixi/utils-pixi';
import { Image as ImageNode } from './nodes/image/image';
import {
  Video as VideoNode,
  inputResourceIdSocketName,
  inputFileNameSocketName,
} from './nodes/draw/video';
import { sqlQuerySocketName } from './nodes/utility/database';

export const dragAndDrop = (acceptedFiles, fileRejections, event) => {
  console.log(acceptedFiles, fileRejections);

  const dropPoint = PPGraph.currentGraph.viewport.toWorld(
    // no event exists in case graph gets loaded from file
    new PIXI.Point(event?.clientX ?? 0, event?.clientY ?? 0)
  );

  let nodePosX = dropPoint.x;
  const nodePosY = dropPoint.y;
  const newNodeSelection: PPNode[] = [];

  (async function () {
    for (let index = 0; index < acceptedFiles.length; index++) {
      const file = acceptedFiles[index];
      const objectURL = URL.createObjectURL(file);

      const extension = file.name
        .slice(((file.name.lastIndexOf('.') - 1) >>> 0) + 2)
        .toLowerCase();
      const preExtension = file.name.replace('.' + extension, '');

      // select what node to create
      const response = await fetch(objectURL);
      let data;
      let newNode;

      const localResourceId = `${file.path}-${file.size}`;

      switch (extension) {
        case 'ppgraph':
          data = await response.text();
          await PPStorage.getInstance().loadGraphFromData(
            JSON.parse(data),
            preExtension
          );
          break;
        case 'csv':
        case 'ods':
        case 'numbers':
        case 'xls':
        case 'xlsm':
        case 'xlsb':
        case 'xlsx':
          /* data is an ArrayBuffer */
          data = await response.arrayBuffer();
          newNode = await PPGraph.currentGraph.addNewNode('Table', {
            nodePosX,
            nodePosY,
            initialData: data,
          });
          break;
        case 'txt':
          data = await response.text();
          newNode = await PPGraph.currentGraph.addNewNode('TextEditor', {
            nodePosX,
            nodePosY,
            initialData: { plain: data },
          });
          break;
        case 'json':
        case 'js':
        case 'jsx':
        case 'ts':
        case 'tsx':
          data = await response.text();
          newNode = await PPGraph.currentGraph.addNewNode('CodeEditor', {
            nodePosX,
            nodePosY,
            initialData: data,
          });
          break;
        case 'jpg':
        case 'png':
          data = await response.blob();
          const base64 = await convertBlobToBase64(data).catch((err) => {
            console.error(err);
          });
          if (base64) {
            if (
              PPGraph.currentGraph.selection.selectedNodes?.[index]?.type ===
              'Image'
            ) {
              const existingNode = PPGraph.currentGraph.selection.selectedNodes[
                index
              ] as ImageNode;
              await existingNode.updateAndExecute(base64 as string);
            } else {
              newNode = await PPGraph.currentGraph.addNewNode('Image', {
                nodePosX,
                nodePosY,
                defaultArguments: { Image: base64 },
              });
            }
          }
          break;
        case '3gp':
        case 'avi':
        case 'flv':
        case 'mov':
        case 'mkv':
        case 'm4v':
        case 'mp4':
        case 'ogg':
        case 'qt':
        case 'swf':
        case 'webm':
        case 'wmv':
          data = await response.blob();
          PPStorage.getInstance().storeResource(
            localResourceId,
            file.size,
            data,
            file.path
          );
          if (
            PPGraph.currentGraph.selection.selectedNodes?.[index]?.type ===
            'Video'
          ) {
            const existingNode = PPGraph.currentGraph.selection.selectedNodes[
              index
            ] as VideoNode;
            existingNode.updateAndExecute(localResourceId, file.path);
          } else {
            newNode = await PPGraph.currentGraph.addNewNode('Video', {
              nodePosX,
              nodePosY,
              defaultArguments: {
                [inputResourceIdSocketName]: localResourceId,
                [inputFileNameSocketName]: file.path,
              },
            });
          }
          break;
        case 'pxshow':
        case 'sqlite':
        case 'sqlite3':
        case 'db':
        case 'db3':
        case 's3db':
        case 'sl3':
          data = await response.blob();
          PPStorage.getInstance().storeResource(
            localResourceId,
            file.size,
            data,
            file.path
          );
          if (
            PPGraph.currentGraph.selection.selectedNodes?.[index]?.type ===
            'SqliteReader'
          ) {
            const existingNode = PPGraph.currentGraph.selection.selectedNodes[
              index
            ] as any;
            existingNode.updateAndExecute(localResourceId, file.path);
          } else {
            const sqlQuery =
              extension === 'pxshow' ? PXSHOW_SQL_QUERY : undefined;
            newNode = await PPGraph.currentGraph.addNewNode('SqliteReader', {
              nodePosX,
              nodePosY,
              defaultArguments: {
                [inputResourceIdSocketName]: localResourceId,
                [inputFileNameSocketName]: file.path,
                [sqlQuerySocketName]: sqlQuery,
              },
            });
          }
          break;
        default:
          break;
      }

      // update postion if there are more than one
      if (newNode) {
        newNodeSelection.push(newNode);
        nodePosX = nodePosX + newNode.nodeWidth + DRAGANDDROP_GRID_MARGIN;
      }
    }
    // select the newly added nodes
    if (newNodeSelection.length > 0) {
      PPGraph.currentGraph.selection.selectNodes(newNodeSelection, false, true);
      ensureVisible(PPGraph.currentGraph.selection.selectedNodes);
      InterfaceController.showSnackBar(
        `${newNodeSelection.length} new ${
          newNodeSelection.length === 1 ? 'node was' : 'nodes were'
        } added`
      );
    }
  })();
};
