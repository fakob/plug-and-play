import * as PIXI from 'pixi.js';
import React, { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import Spreadsheet, { Options } from '@bergfreunde/x-data-spreadsheet';
import PPGraph from '../classes/GraphClass';
import PPNode from '../classes/NodeClass';
import { CustomArgs } from '../utils/interfaces';
import { stox, xtos } from '../utils/xlsxspread';
import { StringType } from './datatypes/stringType';
import { TriggerType } from './datatypes/triggerType';
import { AnyType } from './datatypes/anyType';

export class Table extends PPNode {
  _imageRef: PIXI.Sprite;
  _imageRefClone: PIXI.Sprite;
  defaultProps;
  createElement;
  spreadsheetId: string;
  workbook: XLSX.WorkBook;
  initialData: any;
  spreadSheet: Spreadsheet;
  parsedData: any;
  update: () => void;

  constructor(name: string, graph: PPGraph, customArgs?: CustomArgs) {
    const nodeWidth = 600;
    const nodeHeight = 400;
    const isHybrid = true;

    super(name, graph, {
      ...customArgs,
      nodeWidth,
      nodeHeight,
      minNodeWidth: nodeWidth / 2,
      minNodeHeight: nodeHeight / 2,
      isHybrid,
    });

    // get initialData if available else create an empty workbook
    this.initialData = customArgs?.initialData;

    this.addOutput('selectedData', new StringType());
    this.addInput('reload', new TriggerType());
    // this.addInput('data', new AnyType(), customArgs?.data);

    this.name = 'Table';
    this.description = 'Adds a table';

    this.spreadsheetId = `x-spreadsheet-${this.id}`;
    this.workbook = XLSX.utils.book_new();

    // when the Node is added, add the container and react component
    this.onNodeAdded = () => {
      console.log(this.initialData);
      if (this.initialData) {
        this.workbook = XLSX.read(this.initialData);
      } else {
        this.workbook = XLSX.utils.book_new();
      }
      /* use sheet_to_json with header: 1 to generate an array of arrays */
      // const sheet = this.workbook.Sheets[this.workbook.SheetNames[0]];
      // const data = XLSX.utils.sheet_to_json(sheet, {
      //   header: 1,
      // });
      // console.log(sheet);
      // console.log(data);
      // console.log(this.workbook);

      this.parsedData = stox(this.workbook);
      this.createContainerComponent(document, TableParent, {
        dataArray: this.parsedData,
        nodeWidth: this.nodeWidth,
        nodeHeight: this.nodeHeight,
      });
    };

    // when the Node is loaded, update the react component
    this.onConfigure = (): void => {
      this.update();
    };

    this.onNodeResize = () => {
      this.update();
    };

    // when the Node is loaded, update the react component
    this.update = (): void => {
      console.log(this.workbook);
      this.parsedData = stox(this.workbook);
      this.renderReactComponent(TableParent, {
        dataArray: this.parsedData,
        nodeWidth: this.nodeWidth,
        nodeHeight: this.nodeHeight,
      });
      this.setOutputData('selectedData', this.parsedData);
    };

    // small presentational component
    const TableParent = (props) => {
      const [dataArray, setDataArray] = useState<any>(props.dataArray);

      const options: Options = {
        mode: 'edit', // edit | read
        showToolbar: true,
        showGrid: true,
        showContextmenu: true,
        view: {
          width: () => this.nodeWidth,
          height: () => this.nodeHeight,
        },
        row: {
          len: 100,
          height: 24,
        },
        col: {
          len: 26,
          width: 104,
          indexWidth: 56,
          minWidth: 60,
        },
        style: {
          bgcolor: '#ffffff',
          align: 'left',
          valign: 'middle',
          textwrap: false,
          strike: false,
          underline: false,
          color: '#0a0a0a',
          font: {
            name: 'Helvetica',
            size: 10,
            bold: false,
            italic: false,
          },
        },
      };

      const handleOnSelect = (cell, { sri, sci, eri, eci }) => {
        console.log(sri, sci, eri, eci);
        console.log(cell);
      };

      useEffect(() => {
        console.log(dataArray);
        this.spreadSheet = new Spreadsheet(
          document.getElementById(this.spreadsheetId),
          options
        )
          .loadData(dataArray)
          .change((data) => {
            console.log(data);
            setDataArray(data);
          });
        this.spreadSheet.on('cells-selected', handleOnSelect);
      }, []);

      useEffect(() => {
        console.log(props.nodeWidth, props.nodeHeight);
        this.spreadSheet.reRender();
      }, [props.nodeWidth, props.nodeHeight]);

      return <div id={this.spreadsheetId} />;
    };
  }

  // parseData(data: string): any {
  //   const results = csvParser.parse(data, {});
  //   console.log(results);
  //   return results?.data;
  // }

  trigger(): void {
    this.update();
  }
}
