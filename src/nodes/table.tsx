import * as PIXI from 'pixi.js';
import React, {
  FunctionComponent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import * as XLSX from 'xlsx';
import DataEditor, {
  CellClickedEventArgs,
  CompactSelection,
  DataEditorRef,
  EditableGridCell,
  GridCell,
  GridCellKind,
  GridColumn,
  GridSelection,
  GridMouseEventArgs,
  Item,
  Rectangle,
} from '@glideapps/glide-data-grid';
import '@glideapps/glide-data-grid/dist/index.css';
import {
  Box,
  Divider,
  IconButton,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Menu,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SortIcon from '@mui/icons-material/Sort';
import DeleteIcon from '@mui/icons-material/Delete';
import PPSocket from '../classes/SocketClass';
import {
  addColumnToArrayOfArrays,
  addRowToArrayOfArrays,
  getLongestArrayInArray,
  indexToAlphaNumName,
  limitRange,
  removeColumnFromArrayOfArrays,
  removeRowFromArrayOfArrays,
} from '../utils/utils';
import { SOCKET_TYPE } from '../utils/constants';
import { CustomArgs } from '../utils/interfaces';
import { ArrayType } from './datatypes/arrayType';
import { JSONType } from './datatypes/jsonType';
import { NumberType } from './datatypes/numberType';
import HybridNode from '../classes/HybridNode';
import { CustomFunction } from './data/dataFunctions';
import { StringType } from './datatypes/stringType';
import { AbstractType } from './datatypes/abstractType';
import { BooleanType } from './datatypes/booleanType';

const workBookSocketName = 'workBook';
const arrayOfArraysSocketName = 'Array of arrays';
const JSONSocketName = 'JSON';
const workBookInputSocketName = 'Initial data';
const sheetIndexInputSocketName = 'Sheet index';

type MyProps = {
  doubleClicked: boolean; // is injected by the NodeClass
  workBook: XLSX.WorkBook;
  sheetIndex: number;
  nodeWidth: number;
  nodeHeight: number;
};

export class Table extends HybridNode {
  _imageRef: PIXI.Sprite;
  _imageRefClone: PIXI.Sprite;
  defaultProps;
  createElement;
  workBook: XLSX.WorkBook;
  parsedData: any;

  constructor(name: string, customArgs?: CustomArgs) {
    super(name, {
      ...customArgs,
    });

    this.workBook = XLSX.utils.book_new();
  }

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
      new PPSocket(SOCKET_TYPE.OUT, JSONSocketName, new JSONType()),
      new PPSocket(SOCKET_TYPE.OUT, arrayOfArraysSocketName, new ArrayType()),
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

  protected onHybridNodeExit(): void {
    this.executeOptimizedChain();
  }

  public getMinNodeWidth(): number {
    return 200;
  }

  public getMinNodeHeight(): number {
    return 150;
  }

  public getDefaultNodeWidth(): number {
    return 800;
  }

  public getDefaultNodeHeight(): number {
    return 400;
  }

  // when the Node is added, add the container and react component
  public onNodeAdded = () => {
    let sheetIndex = 0;
    if (this.initialData) {
      sheetIndex = this.getIndex();
      this.workBook = XLSX.read(this.initialData);
      this.setInputData(workBookInputSocketName, this.workBook);
      this.setAllOutputData(this.workBook);
    } else {
      // create workbook with an empty worksheet
      this.workBook = XLSX.utils.book_new();
      const ws_data = new Array(24).fill(Array(24).fill(''));
      const worksheet = XLSX.utils.aoa_to_sheet(ws_data);
      XLSX.utils.book_append_sheet(this.workBook, worksheet, 'Sheet1');
    }

    this.createContainerComponent(this.TableParent, {
      workBook: this.workBook,
      sheetIndex,
      nodeWidth: this.nodeWidth,
      nodeHeight: this.nodeHeight,
    });
    super.onNodeAdded();
  };

  public update = (): void => {
    const sheetIndex = this.getIndex();
    this.renderReactComponent(this.TableParent, {
      workBook: this.workBook,
      sheetIndex,
      nodeWidth: this.nodeWidth,
      nodeHeight: this.nodeHeight,
    });
    this.setAllOutputData(this.workBook);
  };

  // when the Node is loaded, update the react component
  public onConfigure = (): void => {
    const dataFromInput = this.getInputData(workBookInputSocketName);
    if (dataFromInput) {
      this.workBook = this.createWorkBookFromJSON(dataFromInput);
      this.setAllOutputData(this.workBook);
    }
    this.update();
  };

  public onNodeResize = () => {
    this.update();
  };

  public onExecute = async function () {
    this.update();
  };

  public TableParent: FunctionComponent<MyProps> = (props) => {
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

    const unselected = {
      current: undefined,
      rows: CompactSelection.empty(),
      columns: CompactSelection.empty(),
    };

    const getCols = (): GridColumn[] => {
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
        gridColumn.push({
          title: String(col || indexToAlphaNumName(index)),
          id: String(col || indexToAlphaNumName(index)).toLowerCase(),
          hasMenu: true,
        });
      }
      return gridColumn;
    };

    const ref = useRef<DataEditorRef | null>(null);
    const [arrayOfArrays, setArrayOfArrays] = useState([]);
    const [colsMap, setColsMap] = useState(() => getCols());
    const [gridSelection, setGridSelection] =
      useState<GridSelection>(unselected);
    const [colMenu, setColMenu] = useState<{
      col: number;
      pos: PIXI.Point;
    }>();
    const [rowMenu, setRowMenu] = useState<{
      row: number;
      pos: PIXI.Point;
    }>();
    const [hoverRow, setHoverRow] = useState<number | undefined>(undefined);

    const onItemHovered = useCallback((args: GridMouseEventArgs) => {
      const [_, row] = args.location;
      setHoverRow(args.kind !== 'cell' ? undefined : row);
    }, []);

    const getRowThemeOverride = useCallback(
      (row) => {
        if (row !== hoverRow) return undefined;
        return {
          bgCell: '#f7f7f7',
          bgCellMedium: '#f0f0f0',
        };
      },
      [hoverRow]
    );

    const isColOpen = colMenu !== undefined;
    const isRowOpen = rowMenu !== undefined;

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

    useEffect(() => {
      setColsMap(() => getCols());
    }, [arrayOfArrays.length, props.sheetIndex]);

    useEffect(() => {
      saveAndOutput();
    }, [arrayOfArrays, colsMap]);

    const saveAndOutput = useCallback((): void => {
      const worksheet = XLSX.utils.aoa_to_sheet(arrayOfArrays);
      this.workBook.Sheets[this.workBook.SheetNames[props.sheetIndex]] =
        worksheet;

      this.setInputData(workBookInputSocketName, this.workBook);
      this.setAllOutputData(this.workBook);
      this.executeChildren();
    }, [arrayOfArrays, colsMap, arrayOfArrays.length, props.sheetIndex]);

    const getContent = useCallback(
      (cell: Item): GridCell => {
        const [col, row] = cell;
        const dataRow = arrayOfArrays[row];
        if (dataRow) {
          const d = String(dataRow[col] ?? '');
          return {
            kind: GridCellKind.Text,
            allowOverlay: true,
            allowWrapping: true,
            readonly: false,
            displayData: d,
            data: d,
          };
        } else {
          return {
            kind: GridCellKind.Text,
            allowOverlay: true,
            allowWrapping: true,
            readonly: false,
            displayData: '',
            data: '',
          };
        }
      },
      [arrayOfArrays, colsMap, arrayOfArrays.length, props.sheetIndex]
    );

    const cols = useMemo(
      () => colsMap,
      [colsMap, arrayOfArrays.length, props.sheetIndex]
    );

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
        const rowDifference = target[1] + values.length - arrayOfArrays.length;
        if (rowDifference > 0) {
          // extending the dataset when the pasted data is larger is not working directly
          // one has to paste twice. first pasting extends the data set, second one pastes the data
          const arrayToAppend = Array.from({ length: rowDifference }, () =>
            Array(1).fill('')
          );
          setArrayOfArrays(arrayOfArrays.concat(arrayToAppend));
        }
        // update column names and width if needed
        setColsMap(() => getCols());
        return true;
      },
      [arrayOfArrays.length, props.sheetIndex]
    );

    const onCellEdited = useCallback(
      (cell: Item, newValue: EditableGridCell) => {
        if (newValue.kind !== GridCellKind.Text) {
          // we only have text cells, might as well just die here.
          return;
        }
        const [col, row] = cell;
        arrayOfArrays[row][col] = newValue.data;

        saveAndOutput();
        // update column names and width if needed
        setColsMap(() => getCols());
      },
      [colsMap, arrayOfArrays.length, props.sheetIndex]
    );

    const onColumnResize = useCallback(
      (column: GridColumn, newSize: number) => {
        setColsMap((prevColsMap) => {
          const index = prevColsMap.findIndex(
            (ci) => ci.title === column.title
          );
          const newArray = [...prevColsMap];
          newArray.splice(index, 1, {
            ...prevColsMap[index],
            width: newSize,
          });
          return newArray;
        });
      },
      []
    );

    const onColumnMoved = useCallback(
      (startIndex: number, endIndex: number): void => {
        setColsMap((old) => {
          const newCols = [...old];
          const [toMove] = newCols.splice(startIndex, 1);
          newCols.splice(endIndex, 0, toMove);
          return newCols;
        });
        setArrayOfArrays((old) => {
          const newArrayOfArrays = old.map((row) => {
            const [toMove] = row.splice(startIndex, 1);
            row.splice(endIndex, 0, toMove);
            return row;
          });
          return newArrayOfArrays;
        });
      },
      []
    );

    const onRowMoved = useCallback((from: number, to: number) => {
      setArrayOfArrays((old) => {
        const d = [...old];
        const removed = d.splice(from, 1);
        d.splice(to, 0, ...removed);
        return d;
      });
    }, []);

    function compare(a: string, b: string, desc: boolean): number {
      // make sure that empty lines are always on the bottom
      if (a == '' || a == null) return 1;
      if (b == '' || b == null) return -1;

      if (desc) {
        [b, a] = [a, b];
      }

      return a.localeCompare(b, undefined, {
        numeric: true,
        sensitivity: 'base',
      });
    }

    const onSort = (columnIndex: number, desc: boolean) => {
      setArrayOfArrays((old) => {
        const shallowCopy = [...old];
        shallowCopy.sort((a, b) =>
          compare(a[columnIndex], b[columnIndex], desc)
        );
        return shallowCopy;
      });
    };

    const onHeaderMenuClick = useCallback((col: number, bounds: Rectangle) => {
      console.log('Header menu clicked', col, bounds);
      setColMenu({
        col,
        pos: new PIXI.Point(bounds.x + bounds.width, bounds.y),
      });
    }, []);

    const onContextMenuClick = useCallback(
      (cell: Item, event: CellClickedEventArgs) => {
        event.preventDefault();
        console.log('Row clicked:', cell[1]);
        setRowMenu({
          row: cell[1],
          pos: new PIXI.Point(
            event.bounds.x + event.localEventX,
            event.bounds.y + event.localEventY
          ),
        });
      },
      []
    );

    return (
      <>
        <DataEditor
          ref={ref}
          getCellContent={getContent}
          columns={cols}
          rows={arrayOfArrays.length}
          overscrollX={40}
          maxColumnAutoWidth={500}
          maxColumnWidth={2000}
          onColumnResize={onColumnResize}
          width={props.nodeWidth}
          height={props.nodeHeight}
          getRowThemeOverride={getRowThemeOverride}
          gridSelection={gridSelection}
          onCellEdited={onCellEdited}
          onCellContextMenu={onContextMenuClick}
          onColumnMoved={onColumnMoved}
          onGridSelectionChange={onGridSelectionChange}
          onHeaderMenuClick={onHeaderMenuClick}
          onItemHovered={onItemHovered}
          onPaste={onPaste}
          onRowAppended={() => {
            addRowToArrayOfArrays(arrayOfArrays, arrayOfArrays.length);
          }}
          onRowMoved={onRowMoved}
          fillHandle={true}
          rowSelect="multi"
          rowMarkers={'both'}
          smoothScrollX={true}
          smoothScrollY={true}
          rowSelectionMode="multi"
          getCellsForSelection={true}
          keybindings={{ search: true }}
          trailingRowOptions={{
            sticky: true,
            tint: true,
            hint: 'New row...',
          }}
          rightElement={
            <Box
              sx={{
                width: '40px',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: '#f1f1f1',
              }}
            >
              <IconButton
                sx={{ pt: '4px' }}
                size="small"
                onClick={() => {
                  addColumnToArrayOfArrays(
                    arrayOfArrays,
                    getLongestArrayInArray(arrayOfArrays)
                  );
                  setColsMap(() => getCols());
                }}
              >
                <AddIcon sx={{ fontSize: '16px' }} />
              </IconButton>
            </Box>
          }
          rightElementProps={{
            fill: false,
            sticky: false,
          }}
        />
        <Menu
          open={isColOpen}
          onClose={() => {
            setColMenu(undefined);
          }}
          anchorReference="anchorPosition"
          anchorPosition={{
            top: colMenu?.pos.y ?? 0,
            left: colMenu?.pos.x ?? 0,
          }}
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'left',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'left',
          }}
        >
          <MenuItem
            onClick={() => {
              onSort(colMenu.col, false);
              setColMenu(undefined);
            }}
          >
            <ListItemIcon>
              <SortIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Sort A-Z (no undo!)</ListItemText>
          </MenuItem>
          <MenuItem
            onClick={() => {
              onSort(colMenu.col, true);
              setColMenu(undefined);
            }}
          >
            <ListItemIcon>
              <SortIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Sort Z-A (no undo!)</ListItemText>
          </MenuItem>
          <Divider />
          <MenuItem
            onClick={() => {
              addColumnToArrayOfArrays(arrayOfArrays, colMenu.col);
              setColsMap(() => getCols());
              setColMenu(undefined);
            }}
          >
            <ListItemIcon>
              <AddIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Add column left</ListItemText>
          </MenuItem>
          <MenuItem
            onClick={() => {
              addColumnToArrayOfArrays(arrayOfArrays, colMenu.col + 1);
              setColsMap(() => getCols());
              setColMenu(undefined);
            }}
          >
            <ListItemIcon>
              <AddIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Add column right</ListItemText>
          </MenuItem>
          <Divider />
          <MenuItem
            onClick={() => {
              removeColumnFromArrayOfArrays(arrayOfArrays, colMenu.col);
              setColsMap(() => getCols());
              setColMenu(undefined);
            }}
          >
            <ListItemIcon>
              <DeleteIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Delete column</ListItemText>
          </MenuItem>
        </Menu>
        <Menu
          open={isRowOpen}
          onClose={() => {
            setRowMenu(undefined);
          }}
          anchorReference="anchorPosition"
          anchorPosition={{
            top: rowMenu?.pos.y ?? 0,
            left: rowMenu?.pos.x ?? 0,
          }}
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'left',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'left',
          }}
        >
          <MenuItem
            onClick={() => {
              addRowToArrayOfArrays(arrayOfArrays, rowMenu.row);
              setRowMenu(undefined);
            }}
          >
            <ListItemIcon>
              <AddIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Add row above</ListItemText>
          </MenuItem>
          <MenuItem
            onClick={() => {
              addRowToArrayOfArrays(arrayOfArrays, rowMenu.row + 1);
              setRowMenu(undefined);
            }}
          >
            <ListItemIcon>
              <AddIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Add row below</ListItemText>
          </MenuItem>
          <Divider />
          <MenuItem
            onClick={() => {
              removeRowFromArrayOfArrays(arrayOfArrays, rowMenu.row);
              setRowMenu(undefined);
            }}
          >
            <ListItemIcon>
              <DeleteIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Delete row</ListItemText>
          </MenuItem>
        </Menu>
      </>
    );
  };

  createWorkBookFromJSON(json): any {
    const workBook = XLSX.utils.book_new();
    json.SheetNames.forEach(function (name) {
      XLSX.utils.book_append_sheet(workBook, json.Sheets[name], name);
    });
    return workBook;
  }

  getIndex(): number {
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
    const currentSheetIndex = this.getIndex();
    const sheet = workBook.Sheets[workBook.SheetNames[currentSheetIndex]];
    this.setOutputData(workBookSocketName, workBook);
    this.setOutputData(JSONSocketName, this.getJSON(sheet));
    this.setOutputData(arrayOfArraysSocketName, this.getArrayOfArrays(sheet));
  }
}

export class Table_GetColumnByName extends CustomFunction {
  public getName(): string {
    return 'Get table column by name';
  }
  public getDescription(): string {
    return 'Get column data by column name';
  }
  protected getDefaultFunction(): string {
    return `(ArrayOfArraysIn, ColumnName) => {
  const index = ArrayOfArraysIn[0].findIndex(col => col == ColumnName);
  if (index > -1) {
    return ArrayOfArraysIn.map(row => row[index]).slice(1);
  }
  return [];
}`;
  }
  protected getDefaultParameterValues(): Record<string, any> {
    return { ColumnName: 'ExampleColumn' };
  }
  protected getDefaultParameterTypes(): Record<string, any> {
    return { ArrayOfArraysIn: new ArrayType(), ColumnName: new StringType() };
  }
  protected getOutputParameterType(): AbstractType {
    return new ArrayType();
  }
}

export class Table_GetRowByName extends CustomFunction {
  public getName(): string {
    return 'Get table row by name';
  }
  public getDescription(): string {
    return 'Get row data by row name';
  }
  protected getDefaultFunction(): string {
    return `(ArrayOfArraysIn, ColumnName) => {
  const found = ArrayOfArraysIn.find(row => row[0] == ColumnName);
  if (found !== undefined) {
    return found.slice(1);
  };
  return [];
}`;
  }
  protected getDefaultParameterValues(): Record<string, any> {
    return { ColumnName: 'ExampleRow' };
  }
  protected getDefaultParameterTypes(): Record<string, any> {
    return { ArrayOfArraysIn: new ArrayType(), ColumnName: new StringType() };
  }
  protected getOutputParameterType(): AbstractType {
    return new ArrayType();
  }
}

export class Table_GetRange extends CustomFunction {
  public getName(): string {
    return 'Get table range';
  }
  public getDescription(): string {
    return 'Get table range using start and end index of rows and columns';
  }
  protected getDefaultFunction(): string {
    return `(ArrayOfArraysIn, StartRow, EndRow, StartColumn, EndColumn, FlipAxis) => {
  const sliced = ArrayOfArraysIn.slice(StartRow, EndRow);
  const arrays = sliced.map(row => {
      const newArray = []
      row.forEach((col, index) => {
        if (index >= StartColumn && index <= EndColumn) {
          newArray.push(col);
        }
      })
      return newArray
    });
    if (FlipAxis && arrays.length > 0){
    const newArrays = []
    for (let i = 0; i < arrays[0].length; i++){
      const newArray = []
      for (let j = 0; j < arrays.length; j++){
        newArray.push(arrays[j][i])
      }
      newArrays.push(newArray);
    }
    return newArrays;
  } else {
    return arrays;
  }
}`;
  }
  protected getDefaultParameterValues(): Record<string, any> {
    return {
      StartRow: 0,
      EndRow: 2,
      StartColumn: 0,
      EndColumn: 2,
      FlipAxis: false,
    };
  }
  protected getDefaultParameterTypes(): Record<string, any> {
    return {
      ArrayOfArraysIn: new ArrayType(),
      StartRow: new NumberType(true),
      EndRow: new NumberType(true),
      StartColumn: new NumberType(true),
      EndColumn: new NumberType(true),
      FlipAxis: new BooleanType(),
    };
  }
  protected getOutputParameterType(): AbstractType {
    return new ArrayType();
  }
}
