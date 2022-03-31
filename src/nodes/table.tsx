import * as PIXI from 'pixi.js';
import React, { useEffect } from 'react';
import * as XLSX from 'xlsx';
import Spreadsheet, { Options } from '@bergfreunde/x-data-spreadsheet';
import PPGraph from '../classes/GraphClass';
import PPNode from '../classes/NodeClass';
import { getXLSXSelectionRange } from '../utils/utils';
import { CustomArgs } from '../utils/interfaces';
import { stox, xtos } from '../utils/xlsxspread';
import { AnyType } from './datatypes/anyType';
import { CodeType } from './datatypes/codeType';
import { JSONType } from './datatypes/jsonType';
import { NumberType } from './datatypes/numberType';
import { StringType } from './datatypes/stringType';

const workBookSocketName = 'workBook';
const workSheetSocketName = 'workSheet';
const arrayOfArraysSocketName = 'arrayOfArrays';
const CSVSocketName = 'CSV';
const JSONSocketName = 'JSON';
const workBookInputSocketName = 'workBook';
const sheetIndexInputSocketName = 'currentSheet';

export class Table extends PPNode {
  _imageRef: PIXI.Sprite;
  _imageRefClone: PIXI.Sprite;
  defaultProps;
  createElement;
  spreadsheetId: string;
  workBook: XLSX.WorkBook;
  initialData: any;
  xSpreadSheet: Spreadsheet;
  parsedData: any;
  update: (switchToSheet?: boolean) => void;

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

    this.addOutput(workBookSocketName, new CodeType());
    this.addOutput(workSheetSocketName, new CodeType());
    this.addOutput(JSONSocketName, new JSONType());
    this.addOutput(arrayOfArraysSocketName, new JSONType());
    this.addOutput(CSVSocketName, new StringType());
    this.addInput(workBookInputSocketName, new AnyType(), undefined, false);
    this.addInput(sheetIndexInputSocketName, new NumberType(true), 0);

    this.name = 'Table';
    this.description = 'Adds a table';

    this.spreadsheetId = `x-spreadsheet-${this.id}`;
    this.workBook = XLSX.utils.book_new();

    // when the Node is added, add the container and react component
    this.onNodeAdded = () => {
      if (this.initialData) {
        this.workBook = XLSX.read(this.initialData);
        this.setInputData(workBookInputSocketName, this.workBook);
        this.setAllOutputData(this.workBook);
      } else {
        // create workbook with an empty worksheet
        this.workBook = XLSX.utils.book_new();
        const ws_data = [[''], ['']];
        const worksheet = XLSX.utils.aoa_to_sheet(ws_data);
        XLSX.utils.book_append_sheet(this.workBook, worksheet, 'Sheet1');
      }

      this.parsedData = this.parseData(this.workBook);
      this.createContainerComponent(document, TableParent, {
        dataArray: this.parsedData,
        sheetIndex: 0,
        nodeWidth: this.nodeWidth,
        nodeHeight: this.nodeHeight,
      });
    };

    this.update = (): void => {
      this.parsedData = this.parseData(this.workBook);
      const sheetIndex = this.getInputData(sheetIndexInputSocketName);
      this.renderReactComponent(TableParent, {
        dataArray: this.parsedData,
        sheetIndex,
        nodeWidth: this.nodeWidth,
        nodeHeight: this.nodeHeight,
      });
      this.setAllOutputData(this.workBook);
    };

    // when the Node is loaded, update the react component
    this.onConfigure = (): void => {
      const dataFromInput = this.getInputData(workBookInputSocketName);
      if (dataFromInput) {
        this.workBook = this.createWorkBookFromJSON(dataFromInput);
        this.setAllOutputData(this.workBook);
      }
      this.update();
    };

    this.onHybridNodeExit = () => {
      this.executeOptimizedChain();
    };

    this.onNodeResize = () => {
      this.update();
    };

    this.onExecute = async function () {
      this.update();
    };

    const TableParent = (props) => {
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

      // const handleOnSelect = (cell, { sri, sci, eri, eci }) => {
      //   const selectionRange = getXLSXSelectionRange(sri, sci, eri, eci);
      //   const currentSheetIndex = this.getInputData(sheetIndexInputSocketName);
      //   const sheet =
      //     this.workBook.Sheets[this.workBook.SheetNames[currentSheetIndex]];
      //   sheet['!ref'] = selectionRange; // manually set range
      // };

      const handleOnClick = (event) => {
        // check if this is a click on the sheet menu to change the sheet
        // if so, get the newSheetIndex
        if (event.target.parentNode.className === 'x-spreadsheet-menu') {
          const xSpreadSheet = this.xSpreadSheet.getData();
          const newSheetIndex = xSpreadSheet.findIndex(
            (item) => item.name === event.target.innerText
          );
          this.setInputData(sheetIndexInputSocketName, newSheetIndex);
        }
      };

      const handleOnChange = () => {
        const xSpreadSheet = this.xSpreadSheet.getData();
        this.workBook = xtos(xSpreadSheet);
        this.setInputData(workBookInputSocketName, xtos(xSpreadSheet));
      };

      useEffect(() => {
        this.xSpreadSheet = new Spreadsheet(
          document.getElementById(this.spreadsheetId),
          options
        )
          .loadData(props.dataArray)
          .change(handleOnChange);
        this.xSpreadSheet.on('cells-selected', handleOnSelect);
      }, []);

      useEffect(() => {
        this.xSpreadSheet.loadData(props.dataArray);
      }, [props.dataArray]);

      useEffect(() => {
        this.xSpreadSheet.reRender();
      }, [props.nodeWidth, props.nodeHeight]);

      return <div onClick={handleOnClick} id={this.spreadsheetId} />;
    };
  }

  parseData(workBook: XLSX.WorkBook): any {
    const parsedData = stox(workBook);
    return parsedData;
  }

  createWorkBookFromJSON(json): any {
    const workBook = XLSX.utils.book_new();
    json.SheetNames.forEach(function (name) {
      XLSX.utils.book_append_sheet(workBook, json.Sheets[name], name);
    });
    return workBook;
  }

  getJSON(sheet: XLSX.WorkSheet): any {
    const data = XLSX.utils.sheet_to_json(sheet);
    return data;
  }

  getArrayOfArrays(sheet: XLSX.WorkSheet): any {
    const data = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
    });
    return data;
  }

  getCSV(sheet: XLSX.WorkSheet): any {
    const data = XLSX.utils.sheet_to_csv(sheet);
    return data;
  }

  setAllOutputData(workBook: XLSX.WorkBook): any {
    const currentSheetIndex = this.getInputData(sheetIndexInputSocketName);
    const sheet = workBook.Sheets[workBook.SheetNames[currentSheetIndex]];
    this.setOutputData(workBookSocketName, workBook);
    this.setOutputData(workSheetSocketName, sheet);
    this.setOutputData(JSONSocketName, this.getJSON(sheet));
    this.setOutputData(CSVSocketName, this.getCSV(sheet));
    this.setOutputData(arrayOfArraysSocketName, this.getArrayOfArrays(sheet));
  }
}
