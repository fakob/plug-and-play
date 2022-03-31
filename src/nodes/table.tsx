import * as PIXI from 'pixi.js';
import React, { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import Spreadsheet, { Options } from '@bergfreunde/x-data-spreadsheet';
import PPGraph from '../classes/GraphClass';
import PPNode from '../classes/NodeClass';
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

    // when the Node is loaded, update the react component
    this.onConfigure = (): void => {
      const dataFromInput = this.getInputData(workBookInputSocketName);
      if (dataFromInput) {
        this.workBook = this.createWorkBookFromJSON(dataFromInput);
        this.setAllOutputData(this.workBook);
      }
      this.update(true);
    };

    this.onHybridNodeExit = () => {
      console.log('onHybridNodeExit');
      this.executeOptimizedChain();
    };

    this.onNodeResize = () => {
      this.update();
    };

    // when the Node is loaded, update the react component
    this.update = (switchToSheet = false): void => {
      console.log(this.workBook);
      this.parsedData = this.parseData(this.workBook);
      const sheetIndex = this.getInputData(sheetIndexInputSocketName);
      console.log(this.id, sheetIndex);
      this.renderReactComponent(TableParent, {
        dataArray: this.parsedData,
        sheetIndex,
        switchToSheet,
        nodeWidth: this.nodeWidth,
        nodeHeight: this.nodeHeight,
      });
      this.setAllOutputData(this.workBook);
    };

    this.onExecute = async function (input) {
      this.update();
    };

    // small presentational component
    const TableParent = (props) => {
      // const [dataArray, setDataArray] = useState<any>(props.dataArray);

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
        console.log(
          XLSX.utils.encode_row(sri),
          XLSX.utils.encode_col(sci),
          XLSX.utils.encode_row(eri),
          XLSX.utils.encode_col(eci)
        );
        const xSpreadSheet = this.xSpreadSheet.getData();
        console.log(xSpreadSheet);
        console.log(this.xSpreadSheet);
        console.log((this.xSpreadSheet as any).data.rows.maxCell());
        console.log(cell);
      };

      const handleOnClick = (e) => {
        const xSpreadSheet = this.xSpreadSheet.getData();
        // check if it is a click on the sheet menu to change sheet
        if (e.target.parentNode.className === 'x-spreadsheet-menu') {
          const newSheetIndex = xSpreadSheet.findIndex(
            (item) => item.name === e.target.innerText
          );
          console.log(
            'click on the sheet menu',
            newSheetIndex,
            xSpreadSheet,
            this.workBook,
            xtos(xSpreadSheet)
          );
          this.setInputData(sheetIndexInputSocketName, newSheetIndex);
          // this.setAllOutputData(xtos(xSpreadSheet));
          // this.setAllOutputData(this.workBook);
          // this.executeChildren();
        }
      };

      const handleOnChange = (data) => {
        const xSpreadSheet = this.xSpreadSheet.getData();
        console.log('changed content', data);
        console.log(xSpreadSheet);
        // console.log(this.workBook);
        console.log(xtos(xSpreadSheet));
        this.workBook = xtos(xSpreadSheet);
        this.setInputData(workBookInputSocketName, xtos(xSpreadSheet));
        // this.setAllOutputData(xtos(xSpreadSheet));
        // this.setAllOutputData(this.workBook);
        // this.executeChildren();
        // this.executeOptimizedChain();
        // this.update();
        // setDataArray(data);
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
        console.log(props.dataArray);
        // setDataArray(props.dataArray);
        // this.changeTableDimensions(props.dataArray, props.sheetIndex ?? 0);
        this.xSpreadSheet.loadData(props.dataArray);

        // if table is loading simulate a click to the correct sheet
        if (props.switchToSheet) {
          const newSheetIndex = Math.min(
            props.dataArray.length - 1,
            props.sheetIndex ?? 0
          );
          // console.log(props.dataArray.length - 1, newSheetIndex);
          const element: HTMLElement = document.querySelector(
            `#Container-${this.id} .x-spreadsheet-menu li:nth-child(${
              newSheetIndex + 2
            })`
          );
          // console.log(element);
          if (element) {
            element.click();
          }
        }
      }, [props.dataArray, props.sheetIndex]);

      useEffect(() => {
        // console.log(props.nodeWidth, props.nodeHeight);
        this.xSpreadSheet.reRender();
      }, [props.nodeWidth, props.nodeHeight]);

      return <div onClick={handleOnClick} id={this.spreadsheetId} />;
    };
  }

  changeTableDimensions(newDataArray, currentSheetIndex: number): void {
    // console.log(newDataArray.length - 1, currentSheetIndex);
    const newSheetIndex = Math.min(newDataArray.length - 1, currentSheetIndex);
    // console.log(
    //   newDataArray,
    //   newDataArray[newSheetIndex],
    //   newDataArray[newSheetIndex]?.merges,
    //   newDataArray[newSheetIndex]?.merges.length
    // );

    const newRowCount = Object.keys(newDataArray[newSheetIndex].rows).length;
    (this.xSpreadSheet as any).options.row.len = newRowCount;

    // check if cell is not merged and only then try to set column count
    // otherwise ignore changin the column count
    if (newDataArray[newSheetIndex].merges?.length === 0) {
      const newColumnCount = Object.keys(
        newDataArray[newSheetIndex].rows?.[0].cells
      ).length;
      // console.log(newDataArray, currentSheetIndex, newRowCount, newColumnCount);
      (this.xSpreadSheet as any).options.col.len = newColumnCount;
    } else {
      (this.xSpreadSheet as any).options.col.len = 26; // reset column count
    }

    this.xSpreadSheet.reRender();
  }

  parseData(workBook: XLSX.WorkBook): any {
    const parsedData = stox(workBook);
    // console.log(parsedData);
    return parsedData;
  }

  createWorkBookFromJSON(json): any {
    // console.log(json);
    const workBook = XLSX.utils.book_new();
    // console.log(workBook);
    json.SheetNames.forEach(function (name) {
      // console.log(name, json.Sheets[name]);
      XLSX.utils.book_append_sheet(workBook, json.Sheets[name], name);
    });
    // console.log(workBook);
    return workBook;
  }

  setAllOutputData(workBook: XLSX.WorkBook): any {
    this.setOutputData(workBookSocketName, workBook);
    const currentSheetIndex = this.getInputData(sheetIndexInputSocketName);
    const sheet = workBook.Sheets[workBook.SheetNames[currentSheetIndex]];
    this.setOutputData(workSheetSocketName, sheet);
    this.setOutputData(JSONSocketName, this.getJSON(workBook));
    this.setOutputData(CSVSocketName, this.getCSV(workBook));
    this.setOutputData(
      arrayOfArraysSocketName,
      this.getArrayOfArrays(workBook)
    );
  }

  getCSV(workBook: XLSX.WorkBook): any {
    const currentSheetIndex = this.getInputData(sheetIndexInputSocketName);
    const sheet = workBook.Sheets[workBook.SheetNames[currentSheetIndex]];
    // sheet['!ref'] = 'A1:Z100'; // manually set range
    const data = XLSX.utils.sheet_to_csv(sheet);
    // console.log(workBook);
    // console.log(currentSheetIndex);
    console.log(sheet['!ref'], sheet['A1']);
    console.log(data);
    return data;
  }

  getJSON(workBook: XLSX.WorkBook): any {
    const currentSheetIndex = this.getInputData(sheetIndexInputSocketName);
    const sheet = workBook.Sheets[workBook.SheetNames[currentSheetIndex]];
    // sheet['!ref'] = 'A1:Z100'; // manually set range
    const data = XLSX.utils.sheet_to_json(sheet, {
      // range: 'A1:ZZ100',
    });
    // console.log(workBook);
    // console.log(currentSheetIndex);
    console.log(sheet['!ref'], sheet['A1']);
    console.log(data);
    return data;
  }

  getArrayOfArrays(workBook: XLSX.WorkBook): any {
    /* use sheet_to_json with header: 1 to generate an array of arrays */
    const currentSheetIndex = this.getInputData(sheetIndexInputSocketName);
    const sheet = workBook.Sheets[workBook.SheetNames[currentSheetIndex]];
    // sheet['!ref'] = 'A1:Z100'; // manually set range
    const data = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      // range: 'A1:ZZ100',
    });
    // console.log(workBook);
    console.log(sheet['!ref'], sheet['A1']);
    console.log(data);
    return data;
  }

  trigger(): void {
    this.update();
  }
}
