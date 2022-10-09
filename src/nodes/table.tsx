import * as PIXI from 'pixi.js';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import DataEditor, {
  CompactSelection,
  DataEditorRef,
  EditableGridCell,
  GridCell,
  GridCellKind,
  GridColumn,
  GridSelection,
  Item,
} from '@glideapps/glide-data-grid';
import '@glideapps/glide-data-grid/dist/index.css';
import PPSocket from '../classes/SocketClass';
import {
  appendArrayWithDefaultValues,
  getLongestArrayInArray,
  getXLSXSelectionRange,
  limitRange,
} from '../utils/utils';
import { SOCKET_TYPE } from '../utils/constants';
import { CustomArgs } from '../utils/interfaces';
import { ArrayType } from './datatypes/arrayType';
import { JSONType } from './datatypes/jsonType';
import { NumberType } from './datatypes/numberType';
import { StringType } from './datatypes/stringType';
import HybridNode from '../classes/HybridNode';

const workBookSocketName = 'workBook';
const workSheetSocketName = 'workSheet';
const arrayOfArraysSocketName = 'arrayOfArrays';
const CSVSocketName = 'CSV';
const JSONSocketName = 'JSON';
const workBookInputSocketName = 'workBook';
const sheetIndexInputSocketName = 'currentSheet';

export class Table extends HybridNode {
  _imageRef: PIXI.Sprite;
  _imageRefClone: PIXI.Sprite;
  defaultProps;
  createElement;
  workBook: XLSX.WorkBook;
  initialData: any;
  // xSpreadSheet: Spreadsheet;
  parsedData: any;
  update: (switchToSheet?: boolean) => void;

  protected getActivateByDoubleClick(): boolean {
    return true;
  }

  getPreferredInputSocketName(): string {
    return sheetIndexInputSocketName;
  }

  getPreferredOutputSocketName(): string {
    return JSONSocketName;
  }

  public getName(): string {
    return 'Table';
  }

  public getDescription(): string {
    return 'Adds a table';
  }

  protected getDefaultIO(): PPSocket[] {
    return [
      new PPSocket(SOCKET_TYPE.OUT, workBookSocketName, new JSONType()),
      new PPSocket(SOCKET_TYPE.OUT, workSheetSocketName, new JSONType()),
      new PPSocket(SOCKET_TYPE.OUT, JSONSocketName, new JSONType()),
      new PPSocket(SOCKET_TYPE.OUT, arrayOfArraysSocketName, new ArrayType()),
      new PPSocket(SOCKET_TYPE.OUT, CSVSocketName, new StringType()),
      new PPSocket(
        SOCKET_TYPE.IN,
        workBookInputSocketName,
        new JSONType(),
        undefined,
        false
      ),
      new PPSocket(
        SOCKET_TYPE.IN,
        sheetIndexInputSocketName,
        new NumberType(true),
        0
      ),
    ];
  }

  getOpacity(): number {
    return 0.01;
  }

  protected onNodeExit(): void {
    this.executeOptimizedChain();
  }

  constructor(name: string, customArgs?: CustomArgs) {
    const nodeWidth = 800;
    const nodeHeight = 400;

    super(name, {
      ...customArgs,
      nodeWidth,
      nodeHeight,
      minNodeWidth: nodeWidth / 2,
      minNodeHeight: nodeHeight / 2,
    });

    // get initialData if available else create an empty workbooB
    this.initialData = customArgs?.initialData;

    this.workBook = XLSX.utils.book_new();

    // when the Node is added, add the container and react component
    this.onNodeAdded = () => {
      let sheetIndex = 0;
      if (this.initialData) {
        sheetIndex = this.getPossibleIndex();
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

      this.createContainerComponent(document, TableParent, {
        workBook: this.workBook,
        sheetIndex,
        nodeWidth: this.nodeWidth,
        nodeHeight: this.nodeHeight,
      });
    };

    this.update = (): void => {
      const sheetIndex = this.getPossibleIndex();
      this.renderReactComponent(TableParent, {
        workBook: this.workBook,
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

    this.onNodeResize = () => {
      this.update();
    };

    this.onExecute = async function () {
      this.update();
    };

    type MyProps = {
      doubleClicked: boolean; // is injected by the NodeClass
      workBook: XLSX.WorkBook;
      sheetIndex: number;
      nodeWidth: number;
      nodeHeight: number;
    };

    const TableParent: React.FunctionComponent<MyProps> = (props) => {
      const ref = React.useRef<DataEditorRef | null>(null);
      const [arrayOfArrays, setArrayOfArrays] = useState([]);
      const [gridSelection, setGridSelection] = useState<GridSelection>({
        current: undefined,
        rows: CompactSelection.empty(),
        columns: CompactSelection.empty(),
      });

      const loadSheet = () => {
        const workSheet =
          this.workBook.Sheets[this.workBook.SheetNames[props.sheetIndex]];

        const range = XLSX.utils.decode_range(workSheet['!ref']);
        // sheet_to_json will lost empty row and col at begin as default
        range.s = { c: 0, r: 0 };
        const toJson = XLSX.utils.sheet_to_json(workSheet, {
          raw: false,
          header: 1,
          range: range,
        });
        setArrayOfArrays(toJson);
      };

      useEffect(() => {
        loadSheet();
      }, []);

      useEffect(() => {
        if (props.doubleClicked) {
          ref.current.focus();
        }
      }, [props.doubleClicked]);

      useEffect(() => {
        loadSheet();
      }, [props.workBook, props.sheetIndex]);

      const onGridSelectionChange = useCallback(
        (newSelection: GridSelection): void => {
          // plan to store the selection and give option to output selection only
          // console.log(
          //   newSelection.columns.toArray(),
          //   newSelection.rows.toArray(),
          //   newSelection.current?.cell,
          //   newSelection.current?.range
          // );
          setGridSelection(newSelection);
        },
        []
      );

      const onPaste = useCallback(
        (target: Item, values: readonly (readonly string[])[]) => {
          const rowDifference =
            target[1] + values.length - arrayOfArrays.length;
          if (rowDifference > 0) {
            // extending the dataset when the pasted in data is larger is not working yet
            setArrayOfArrays(
              appendArrayWithDefaultValues(arrayOfArrays, rowDifference, [])
            );
            // return false;
          }
          return true;
        },
        [arrayOfArrays.length]
      );

      const onCellEdited = useCallback(
        (cell: Item, newValue: EditableGridCell) => {
          if (newValue.kind !== GridCellKind.Text) {
            // we only have text cells, might as well just die here.
            return;
          }
          const [col, row] = cell;
          arrayOfArrays[row][col] = newValue.data;

          const worksheet = XLSX.utils.aoa_to_sheet(arrayOfArrays);
          this.workBook.Sheets[this.workBook.SheetNames[props.sheetIndex]] =
            worksheet;

          this.setInputData(workBookInputSocketName, this.workBook);
          this.setAllOutputData(this.workBook);
          this.executeChildren();
        },
        [arrayOfArrays.length]
      );

      const getContent = useCallback(
        (cell: Item): GridCell => {
          const [col, row] = cell;
          const dataRow = arrayOfArrays[row];
          if (dataRow) {
            const d = String(dataRow[col] ?? '');
            return {
              kind: GridCellKind.Text,
              allowOverlay: true,
              readonly: false,
              displayData: d,
              data: d,
            };
          } else {
            return {
              kind: GridCellKind.Text,
              allowOverlay: true,
              readonly: false,
              displayData: 'x',
              data: 'x',
            };
          }
        },
        [arrayOfArrays.length]
      );

      const cols = useMemo<GridColumn[]>(() => {
        const firstRow: [] = arrayOfArrays[0];
        const longestArrayInArray = getLongestArrayInArray(arrayOfArrays);
        if (!firstRow) {
          return [
            {
              title: 'Name',
              id: 'name',
            },
          ];
        }
        const gridColumn = [];
        for (let index = 0; index < longestArrayInArray; index++) {
          const col = firstRow[index];
          console.log(col);
          gridColumn.push({
            title: String(col ?? index),
            id: String(col ?? index).toLowerCase(),
          });
        }
        console.log(gridColumn);
        return gridColumn;
      }, [arrayOfArrays.length]);

      return (
        <DataEditor
          ref={ref}
          getCellContent={getContent}
          columns={cols}
          rows={arrayOfArrays.length}
          width={props.nodeWidth}
          height={props.nodeHeight}
          onCellEdited={onCellEdited}
          gridSelection={gridSelection}
          onGridSelectionChange={onGridSelectionChange}
          onPaste={onPaste}
          rowSelect="multi"
          rowMarkers="clickable-number"
          smoothScrollX={true}
          smoothScrollY={true}
          // theme={getTheme(theme)}
          rowSelectionMode="multi"
          getCellsForSelection={true}
          keybindings={{ search: true }}
          trailingRowOptions={{
            sticky: true,
            tint: true,
            hint: 'New row...',
          }}
        />
      );
    };
  }

  createWorkBookFromJSON(json): any {
    const workBook = XLSX.utils.book_new();
    json.SheetNames.forEach(function (name) {
      XLSX.utils.book_append_sheet(workBook, json.Sheets[name], name);
    });
    return workBook;
  }

  getPossibleIndex(): number {
    return limitRange(
      this.getInputData(sheetIndexInputSocketName),
      0,
      this.workBook.SheetNames.length - 1
    );
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
    const currentSheetIndex = this.getPossibleIndex();
    const sheet = workBook.Sheets[workBook.SheetNames[currentSheetIndex]];
    this.setOutputData(workBookSocketName, workBook);
    this.setOutputData(workSheetSocketName, sheet);
    this.setOutputData(JSONSocketName, this.getJSON(sheet));
    this.setOutputData(CSVSocketName, this.getCSV(sheet));
    this.setOutputData(arrayOfArraysSocketName, this.getArrayOfArrays(sheet));
  }
}
