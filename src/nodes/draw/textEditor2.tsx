import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Box, ThemeProvider } from '@mui/material';
import { ErrorBoundary } from 'react-error-boundary';
import ErrorFallback from '../../components/ErrorFallback';
import PPGraph from '../../classes/GraphClass';
import PPSocket from '../../classes/SocketClass';
import HybridNode2 from '../../classes/HybridNode2';
import { StringType } from '../datatypes/stringType';
import { ColorType } from '../datatypes/colorType';
import { AnyType } from '../datatypes/anyType';

import { TNodeSource, TRgba } from '../../utils/interfaces';
import {
  NODE_TYPE_COLOR,
  SOCKET_TYPE,
  customTheme,
} from '../../utils/constants';
import { JSONType } from '../datatypes/jsonType';
import { BooleanType } from '../datatypes/booleanType';

const initialValue = {};

const outputSocketName = 'Output';
const textOutputSocketName = 'Plain text';
const textJSONSocketName = 'textJSON';
const backgroundColorSocketName = 'Background Color';
const autoHeightName = 'Auto height';
const inputPrefix = 'Input';
const inputName1 = `${inputPrefix} 1`;
const backgroundColor = TRgba.fromString(NODE_TYPE_COLOR.OUTPUT);

const IMPORT_NAME = [
  '@editorjs/editorjs',
  '@editorjs/header',
  '@editorjs/simple-image',
  '@editorjs/code',
  '@editorjs/list',
  '@editorjs/delimiter',
  '@editorjs/table',
  '@editorjs/warning',
  '@editorjs/checklist',
  '@editorjs/link',
  '@editorjs/raw',
  '@editorjs/embed',
  '@editorjs/inline-code',
  '@editorjs/marker',
];

const EDITOR_ID = 'Editorjs';

export class TextEditor2 extends HybridNode2 {
  module;
  editor;
  Header;
  SimpleImage;
  CodeTool;
  List;
  Delimiter;
  Table;
  Warning;
  Checklist;
  LinkTool;
  RawTool;
  Embed;
  InlineCode;
  Marker;

  public getName(): string {
    return 'TT';
  }

  public getDescription(): string {
    return 'A better text editor';
  }

  public getTags(): string[] {
    return ['Draw'].concat(super.getTags());
  }

  public hasExample(): boolean {
    return true;
  }

  getShowLabels(): boolean {
    return false;
  }

  getOpacity(): number {
    return 0.01;
  }

  getColor(): TRgba {
    return TRgba.fromString(NODE_TYPE_COLOR.OUTPUT);
  }

  protected getDefaultIO(): PPSocket[] {
    return [
      new PPSocket(
        SOCKET_TYPE.OUT,
        outputSocketName,
        new JSONType(),
        {},
        false
      ),
      new PPSocket(
        SOCKET_TYPE.OUT,
        textOutputSocketName,
        new StringType(),
        undefined,
        true
      ),
      new PPSocket(
        SOCKET_TYPE.IN,
        textJSONSocketName,
        new JSONType(),
        initialValue,
        false
      ),
      new PPSocket(
        SOCKET_TYPE.IN,
        backgroundColorSocketName,
        new ColorType(),
        backgroundColor,
        false
      ),
      new PPSocket(
        SOCKET_TYPE.IN,
        autoHeightName,
        new BooleanType(),
        true,
        false
      ),
      new PPSocket(SOCKET_TYPE.IN, inputName1, new AnyType(), undefined, true),
    ];
  }

  public getMinNodeHeight(): number {
    return 30;
  }

  public getDefaultNodeWidth(): number {
    return 400;
  }

  public getDefaultNodeHeight(): number {
    return 200;
  }

  public onNodeAdded = async (source?: TNodeSource): Promise<void> => {
    this.module = PPGraph.currentGraph.dynamicImports[IMPORT_NAME[0]].default;
    this.Header = PPGraph.currentGraph.dynamicImports[IMPORT_NAME[1]].default;
    this.SimpleImage =
      PPGraph.currentGraph.dynamicImports[IMPORT_NAME[2]].default;
    this.CodeTool = PPGraph.currentGraph.dynamicImports[IMPORT_NAME[3]].default;
    this.List = PPGraph.currentGraph.dynamicImports[IMPORT_NAME[4]].default;
    this.Delimiter =
      PPGraph.currentGraph.dynamicImports[IMPORT_NAME[5]].default;
    this.Table = PPGraph.currentGraph.dynamicImports[IMPORT_NAME[6]].default;
    this.Warning = PPGraph.currentGraph.dynamicImports[IMPORT_NAME[7]].default;
    this.Checklist =
      PPGraph.currentGraph.dynamicImports[IMPORT_NAME[8]].default;
    this.LinkTool = PPGraph.currentGraph.dynamicImports[IMPORT_NAME[9]].default;
    this.RawTool = PPGraph.currentGraph.dynamicImports[IMPORT_NAME[10]].default;
    this.Embed = PPGraph.currentGraph.dynamicImports[IMPORT_NAME[11]].default;
    this.InlineCode =
      PPGraph.currentGraph.dynamicImports[IMPORT_NAME[12]].default;
    this.Marker = PPGraph.currentGraph.dynamicImports[IMPORT_NAME[13]].default;
    console.log(this.module);

    super.onNodeAdded(source);
  };

  public getDynamicImports(): string[] {
    return [...IMPORT_NAME];
  }

  // small presentational component
  protected getParentComponent(props: any): any {
    const node = props.node;
    const [isModuleLoaded, setIsModuleLoaded] = useState(false);

    const onChange = async (api, event) => {
      console.log("Now I know that Editor's content changed!", event);
      // const data = await node.editor.save();
      node.editor
        .save()
        .then((value) => {
          console.log('Article data: ', value);
          // update in and outputs
          node.setInputData(textJSONSocketName, value);
          node.setOutputData(outputSocketName, value);
          // node.setOutputData(textOutputSocketName, getPlainText(value));
          node.executeChildren();
        })
        .catch((error) => {
          console.log('Saving failed: ', error);
        });
    };

    useEffect(() => {
      console.log(node.textJSONSocketName);
      if (node.module) {
        node.editor = new node.module({
          logLevel: 'VERBOSE',
          holder: `${EDITOR_ID}-${node.id}`,
          onReady: () => {
            setIsModuleLoaded(true);
            console.log('Editor.js is ready to work!');
          },
          onChange: onChange,
          // defaultBlock: 'myOwnParagraph',
          placeholder: 'Let`s write an awesome story!',
          // readOnly: true,
          tools: {
            header: {
              class: node.Header,
              // inlineToolbar: true,
              // inlineToolbar: ['marker', 'inlineCode'],
              config: {
                placeholder: '',
              },
            },

            image: {
              class: node.SimpleImage,
            },

            // linkTool: {
            //   class: node.LinkTool,
            //   config: {
            //     endpoint: '/api/fetchUrl',
            //   },
            // },

            code: {
              class: node.CodeTool,
              shortcut: 'CMD+SHIFT+D',
            },

            list: {
              class: node.List,
              inlineToolbar: true,
            },

            delimiter: node.Delimiter,

            table: {
              class: node.Table,
              inlineToolbar: true,
            },

            warning: {
              class: node.Warning,
              inlineToolbar: true,
            },

            checklist: {
              class: node.Checklist,
              inlineToolbar: true,
            },

            /**
             * Inline Tools
             */
            inlineCode: {
              class: node.InlineCode,
              shortcut: 'CMD+SHIFT+C',
            },

            marker: {
              class: node.Marker,
              shortcut: 'CMD+SHIFT+M',
            },

            raw: node.RawTool,

            embed: node.Embed,
          },
          data: props[textJSONSocketName],
        });
      }
    }, [node.module]);

    // useEffect(() => {
    //   if (props.doubleClicked) {
    //     node.editor.readOnly.toggle();
    //   }
    // }, [props.doubleClicked]);

    return (
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <ThemeProvider theme={customTheme}>
          <Box
            sx={{
              // bgcolor: 'background.paper',
              background: 'white',
              color: 'black',
            }}
            id={`${EDITOR_ID}-${node.id}`}
          />
        </ThemeProvider>
      </ErrorBoundary>
    );
  }
}
