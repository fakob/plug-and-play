/* eslint-disable @typescript-eslint/no-explicit-any */
import * as PIXI from 'pixi.js';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import * as XLSX from 'xlsx';
import DataEditor, {
  CellClickedEventArgs,
  DataEditorRef,
  EditableGridCell,
  GridCell,
  GridCellKind,
  GridColumn,
  GridMouseEventArgs,
  HeaderClickedEventArgs,
  Item,
  Rectangle,
} from '@glideapps/glide-data-grid';
import '@glideapps/glide-data-grid/dist/index.css';
import {
  Box,
  Button,
  ButtonGroup,
  ClickAwayListener,
  Divider,
  Grow,
  IconButton,
  ListItemIcon,
  ListItemText,
  MenuItem,
  MenuList,
  Menu,
  Paper,
  Popper,
  ThemeProvider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import EastIcon from '@mui/icons-material/East';
import SortIcon from '@mui/icons-material/Sort';
import PPSocket from '../../classes/SocketClass';
import {
  addColumnToArrayOfArrays,
  addRowToArrayOfArrays,
  connectNodeToSocket,
  getLongestArrayInArray,
  indexToAlphaNumName,
  limitRange,
  removeColumnFromArrayOfArrays,
  removeRowFromArrayOfArrays,
  sortCompare,
} from '../../utils/utils';
import {
  NODE_TYPE_COLOR,
  SOCKET_TYPE,
  customTheme,
} from '../../utils/constants';
import { TNodeSource, TRgba } from '../../utils/interfaces';
import { ArrayType } from '../datatypes/arrayType';
import { JSONType } from '../datatypes/jsonType';
import { NumberType } from '../datatypes/numberType';
import PPGraph from '../../classes/GraphClass';
import PPNode from '../../classes/NodeClass';
import HybridNode2 from '../../classes/HybridNode2';

const inputSocketName = 'Input';
const arrayOfArraysSocketName = 'Array of arrays';
const rowObjectsNames = 'Array of objects';
const workBookInputSocketName = 'Initial data';
const sheetIndexInputSocketName = 'Sheet index';

const exportOptions = ['xlsx', 'csv', 'txt', 'html', 'rtf'];
export class Table extends HybridNode2 {
  _imageRef: PIXI.Sprite;
  _imageRefClone: PIXI.Sprite;
  defaultProps;
  createElement;
  workBook: XLSX.WorkBook;
  parsedData: any;

  public getName(): string {
    return 'Table';
  }

  public getDescription(): string {
    return 'Adds a table. To import a spreadsheets, just drag the file onto the playground';
  }

  public getTags(): string[] {
    return ['Input'].concat(super.getTags());
  }

  getPreferredInputSocketName(): string {
    return inputSocketName;
  }

  getXLSXModule(): typeof XLSX {
    return PPGraph.currentGraph.dynamicImports['xlsx'];
  }

  public onNodeAdded = async (source: TNodeSource): Promise<void> => {
    console.time('table_added');
    await super.onNodeAdded(source);
    this.workBook = this.getXLSXModule().utils.book_new();
    const storedWorkBookData = this.getInputData(workBookInputSocketName);
    if (this.initialData) {
      // load initialData from import
      console.time('load_initial_data');
      this.workBook = this.getXLSXModule().read(this.initialData);
      this.setInputData(workBookInputSocketName, this.workBook);
      console.timeEnd('load_initial_data');
    } else if (
      storedWorkBookData !== undefined &&
      Object.keys(storedWorkBookData).length !== 0
    ) {
      // load saved data
      console.time('load_saved_data');
      this.workBook = this.createWorkBookFromJSON(storedWorkBookData);
      console.timeEnd('load_saved_data');
    } else {
      console.time('load_new_data');
      // create workbook with an empty worksheet
      this.workBook = this.getXLSXModule().utils.book_new();
      const ws_data = new Array(7).fill(Array(7).fill(''));
      const worksheet = this.getXLSXModule().utils.aoa_to_sheet(ws_data);
      this.getXLSXModule().utils.book_append_sheet(
        this.workBook,
        worksheet,
        'Sheet1',
      );
      console.timeEnd('load_new_data');
    }
    this.setAllOutputData();
    this.loadSheet();
    console.timeEnd('table_added');
  };

  getColumn = async (nameOfColumn) => {
    const added: PPNode = await PPGraph.currentGraph.addNewNode(
      'Table_GetColumnByName',
      {
        nodePosX: this.x + (this.width + 40),
        nodePosY: this.y,
      },
    );

    connectNodeToSocket(
      this.getOutputSocketByName(arrayOfArraysSocketName),
      added,
    );
    added.getSocketByName('ColumnName').data = nameOfColumn;
    added.executeOptimizedChain();
  };

  async addNewArrayGetAndConnect(nameOfRow: string, targetSocketName: string) {
    const added: PPNode = await PPGraph.currentGraph.addNewNode('ArrayGet', {
      nodePosX: this.x + (this.width + 40),
      nodePosY: this.y,
    });

    await connectNodeToSocket(
      this.getOutputSocketByName(targetSocketName),
      added,
    );
    added.getSocketByName('Index').data = nameOfRow;
  }

  getCell = async (cell: Item) => {
    const added: PPNode = await PPGraph.currentGraph.addNewNode('ArrayGet', {
      nodePosX: this.x + (this.width + 40),
      nodePosY: this.y,
    });
    added.getSocketByName('Index').data = cell[1];
    connectNodeToSocket(
      this.getOutputSocketByName(arrayOfArraysSocketName),
      added,
    );
    added.executeOptimizedChain();
    const added2: PPNode = await PPGraph.currentGraph.addNewNode('ArrayGet', {
      nodePosX: added.x + (added.width + 40),
      nodePosY: this.y,
    });
    added2.getSocketByName('Index').data = cell[0];
    connectNodeToSocket(
      added.outputSocketArray.find((socket) => socket.name == 'Element'),
      added2,
    );
    added.executeOptimizedChain();
  };

  createRowFilter = async () => {
    const filterObject = await PPGraph.currentGraph.addNewNode('ObjectFilter', {
      nodePosX: this.x + (this.width + 40),
      nodePosY: this.y,
    });
    connectNodeToSocket(
      this.getOutputSocketByName(rowObjectsNames),
      filterObject,
    );
  };

  public getAdditionalRightClickOptions(): any {
    return {
      'Create row filter': this.createRowFilter,
    };
  }

  protected getDefaultIO(): PPSocket[] {
    return [
      new PPSocket(
        SOCKET_TYPE.OUT,
        rowObjectsNames,
        new ArrayType(),
        [],
        true,
        {},
        true,
        () => this.getJSON(this.getSheet()),
      ),
      new PPSocket(
        SOCKET_TYPE.OUT,
        arrayOfArraysSocketName,
        new ArrayType(),
        [],
        true,
        {},
        true,
        () => this.getArrayOfArrays(this.getSheet()),
      ),
      new PPSocket(
        SOCKET_TYPE.IN,
        workBookInputSocketName,
        new JSONType(),
        {},
        false,
      ),
      new PPSocket(
        SOCKET_TYPE.IN,
        sheetIndexInputSocketName,
        new NumberType(true),
        0,
        false,
      ),
      new PPSocket(SOCKET_TYPE.IN, inputSocketName, new ArrayType(), [], false),
    ];
  }

  getColor(): TRgba {
    return TRgba.fromString(NODE_TYPE_COLOR.INPUT);
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

  // hack, set further down
  private setArrayOfArrays = (any) => {};

  public loadSheet() {
    console.time('load_sheet');
    const sheetIndex = this.getIndex();
    const workSheet =
      this.workBook.Sheets[this.workBook.SheetNames[sheetIndex]];
    try {
      const range = this.getXLSXModule().utils.decode_range(workSheet['!ref']);
      // sheet_to_json will lose empty row and col at begin as default
      range.s = { c: 0, r: 0 };
      const toJson = this.getXLSXModule().utils.sheet_to_json(workSheet, {
        raw: false,
        header: 1,
        range: range,
      });
      this.setArrayOfArrays(toJson);
    } catch (error) {
      this.setArrayOfArrays([[], []]);
    }
    console.timeEnd('load_sheet');
  }

  static onExport(node: Table, selectedExportIndex: number) {
    node
      .getXLSXModule()
      .writeFile(
        node.workBook,
        `${node.name}.${exportOptions[selectedExportIndex]}`,
        {
          sheet: node.workBook.SheetNames[node.getIndex()],
        },
      );
  }

  static getCols(arrayOfArrays: any[]): GridColumn[] {
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
  }

  static saveAndOutput(node: Table, arrayOfArrays) {
    const worksheet = node.getXLSXModule().utils.aoa_to_sheet(arrayOfArrays);
    const sheetIndex = node.getIndex();
    node.workBook.Sheets[node.workBook.SheetNames[sheetIndex]] = worksheet;
    node.setInputData(workBookInputSocketName, node.workBook);
    node.setAllOutputData();
  }
  protected getParentComponent(props: any): React.ReactElement {
    console.time('table_parent_component');
    const node = props.node;

    const ref = useRef<DataEditorRef | null>(null);
    const [arrayOfArrays, setArrayOfArrays] = useState([]);
    node.setArrayOfArrays = setArrayOfArrays;
    const [colsMap, setColsMap] = useState(() => Table.getCols(arrayOfArrays));
    const [colMenu, setColMenu] = useState<{
      col: number;
      pos: PIXI.Point;
    }>();
    const [rowMenu, setRowMenu] = useState<{
      cell: Item;
      pos: PIXI.Point;
    }>();

    const [hoverRow, setHoverRow] = useState<number | undefined>(undefined);
    const [openExportFormat, setExportFormatOpen] = useState(false);
    const anchorRef = useRef<HTMLDivElement>(null);
    const [selectedExportIndex, setSelectedExportIndex] = useState(0);

    const handleExportFormatClose = (event: Event) => {
      if (
        anchorRef.current &&
        anchorRef.current.contains(event.target as HTMLElement)
      ) {
        return;
      }

      setExportFormatOpen(false);
    };

    const handleExportFormatToggle = () => {
      setExportFormatOpen((prevOpen) => !prevOpen);
    };

    const handleExportFormatClick = (
      event: React.MouseEvent<HTMLLIElement, MouseEvent>,
      index: number,
    ) => {
      setSelectedExportIndex(index);
      setExportFormatOpen(false);
    };

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
      [hoverRow],
    );

    const isColOpen = colMenu !== undefined;
    const isRowOpen = rowMenu !== undefined;

    useEffect(() => {
      if (props.doubleClicked) {
        ref.current.focus();
      }
    }, [props.doubleClicked]);

    useEffect(() => {
      node.loadSheet();
    }, [props[workBookInputSocketName], props[sheetIndexInputSocketName]]);

    // it seems like these are called multiple times
    useEffect(() => {
      setColsMap(() => Table.getCols(arrayOfArrays));
    }, [arrayOfArrays.length, props[sheetIndexInputSocketName]]);

    //useEffect(() => {
    //  Table.saveAndOutput(node, arrayOfArrays);
    //}, [arrayOfArrays, colsMap]);

    useEffect(() => {
      if (
        Array.isArray(props[inputSocketName]) &&
        props[inputSocketName][0] !== undefined
      ) {
        try {
          if (Array.isArray(props[inputSocketName][0])) {
            setArrayOfArrays(props[inputSocketName]);
          } else {
            const tempWS = node
              .getXLSXModule()
              .utils.json_to_sheet(props[inputSocketName]);
            const toJson = node.getXLSXModule().utils.sheet_to_json(tempWS, {
              raw: false,
              header: 1,
            });
            setArrayOfArrays(toJson);
          }
          setColsMap(() => Table.getCols(arrayOfArrays));
          Table.saveAndOutput(node, arrayOfArrays);
        } catch (error) {
          setArrayOfArrays([[], []]);
        }
      }
    }, [props[inputSocketName]]);

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
      [
        arrayOfArrays,
        colsMap,
        arrayOfArrays.length,
        props[sheetIndexInputSocketName],
      ],
    );

    const cols = useMemo(
      () => colsMap,
      [colsMap, arrayOfArrays.length, props[sheetIndexInputSocketName]],
    );

    const onPaste = useCallback(
      (target: Item, values: readonly (readonly string[])[]) => {
        const rowDifference = target[1] + values.length - arrayOfArrays.length;
        if (rowDifference > 0) {
          // extending the dataset when the pasted data is larger is not working directly
          // one has to paste twice. first pasting extends the data set, second one pastes the data
          const arrayToAppend = Array.from({ length: rowDifference }, () =>
            Array(1).fill(''),
          );
          setArrayOfArrays(arrayOfArrays.concat(arrayToAppend));
        }
        // update column names and width if needed
        setColsMap(() => Table.getCols(arrayOfArrays));
        return true;
      },
      [arrayOfArrays.length, props[sheetIndexInputSocketName]],
    );

    const onCellEdited = (cell: Item, newValue: EditableGridCell) => {
      if (newValue.kind !== GridCellKind.Text) {
        console.log('CELL IS NOT TEXT?? UNEXPECTED');
        // we only have text cells, might as well just die here.
        return;
      }
      const [col, row] = cell;
      arrayOfArrays[row][col] = newValue.data;

      Table.saveAndOutput(node, arrayOfArrays);
      // update column names and width if needed
      setColsMap(() => Table.getCols(arrayOfArrays));
    };

    const onColumnResize = useCallback(
      (column: GridColumn, newSize: number) => {
        setColsMap((prevColsMap) => {
          const index = prevColsMap.findIndex(
            (ci) => ci.title === column.title,
          );
          const newArray = [...prevColsMap];
          newArray.splice(index, 1, {
            ...prevColsMap[index],
            width: newSize,
          });
          return newArray;
        });
      },
      [],
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
      [],
    );

    const onRowMoved = useCallback((from: number, to: number) => {
      setArrayOfArrays((old) => {
        const d = [...old];
        const removed = d.splice(from, 1);
        d.splice(to, 0, ...removed);
        return d;
      });
    }, []);

    const onSort = (columnIndex: number, desc: boolean) => {
      setArrayOfArrays((old) => {
        const shallowCopy = [...old];
        shallowCopy.sort((a, b) =>
          sortCompare(a[columnIndex], b[columnIndex], desc),
        );
        return shallowCopy;
      });
    };

    const onHeaderMenuClick = useCallback((col: number, bounds: Rectangle) => {
      setColMenu({
        col,
        pos: new PIXI.Point(bounds.x + bounds.width, bounds.y),
      });
    }, []);

    const onHeaderContextMenu = useCallback(
      (col: number, event: HeaderClickedEventArgs) => {
        event.preventDefault();
        setColMenu({
          col,
          pos: new PIXI.Point(
            event.bounds.x + event.localEventX,
            event.bounds.y + event.localEventY,
          ),
        });
      },
      [],
    );

    const onContextMenuClick = useCallback(
      (cell: Item, event: CellClickedEventArgs) => {
        event.preventDefault();
        setRowMenu({
          cell,
          pos: new PIXI.Point(
            event.bounds.x + event.localEventX,
            event.bounds.y + event.localEventY,
          ),
        });
      },
      [],
    );

    console.timeEnd('table_parent_component');

    return (
      <Box sx={{ position: 'relative' }}>
        {props.doubleClicked && (
          <ThemeProvider theme={customTheme}>
            <ButtonGroup
              variant="contained"
              size="small"
              ref={anchorRef}
              sx={{
                position: 'absolute',
                bottom: '8px',
                right: '8px',
                zIndex: 10,
              }}
            >
              <Button
                size="small"
                onClick={handleExportFormatToggle}
                sx={{ px: 1 }}
              >
                {exportOptions[selectedExportIndex]}
              </Button>
              <Button onClick={() => Table.onExport(node, selectedExportIndex)}>
                <DownloadIcon sx={{ ml: 0.5, fontSize: '16px' }} />{' '}
              </Button>
            </ButtonGroup>
            <Popper
              sx={{
                zIndex: 1,
              }}
              open={openExportFormat}
              anchorEl={anchorRef.current}
              role={undefined}
              transition
              disablePortal
              placement="top-start"
            >
              {({ TransitionProps }) => (
                <Grow
                  {...TransitionProps}
                  style={{
                    transformOrigin: 'center bottom',
                  }}
                >
                  <Paper>
                    <ClickAwayListener onClickAway={handleExportFormatClose}>
                      <MenuList id="split-button-menu" autoFocusItem>
                        {exportOptions.map((option, index) => (
                          <MenuItem
                            key={option}
                            selected={index === selectedExportIndex}
                            onClick={(event) =>
                              handleExportFormatClick(event, index)
                            }
                          >
                            {option}
                          </MenuItem>
                        ))}
                      </MenuList>
                    </ClickAwayListener>
                  </Paper>
                </Grow>
              )}
            </Popper>
          </ThemeProvider>
        )}
        <DataEditor
          ref={ref}
          getCellContent={getContent}
          columns={cols}
          rows={arrayOfArrays.length}
          overscrollX={40}
          maxColumnAutoWidth={500}
          maxColumnWidth={2000}
          onColumnResize={onColumnResize}
          width={node.nodeWidth}
          height={node.nodeHeight}
          getRowThemeOverride={getRowThemeOverride}
          onCellEdited={onCellEdited}
          onCellContextMenu={onContextMenuClick}
          onColumnMoved={onColumnMoved}
          onHeaderContextMenu={onHeaderContextMenu}
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
                    getLongestArrayInArray(arrayOfArrays),
                  );
                  setColsMap(() => Table.getCols(arrayOfArrays));
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
              node.getColumn(arrayOfArrays[0][colMenu.col]);
              setColMenu(undefined);
            }}
          >
            <ListItemIcon>
              <EastIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Get column data</ListItemText>
          </MenuItem>
          <Divider />
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
              setColsMap(() => Table.getCols(arrayOfArrays));
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
              setColsMap(() => Table.getCols(arrayOfArrays));
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
              setColsMap(() => Table.getCols(arrayOfArrays));
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
              node.getCell(rowMenu.cell);
              setRowMenu(undefined);
            }}
          >
            <ListItemIcon>
              <EastIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Get cell data</ListItemText>
          </MenuItem>
          <MenuItem
            onClick={() => {
              node.addNewArrayGetAndConnect(
                rowMenu.cell[1],
                arrayOfArraysSocketName,
              );
              setRowMenu(undefined);
            }}
          >
            <ListItemIcon>
              <EastIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Get row data (as array)</ListItemText>
          </MenuItem>
          <MenuItem
            onClick={() => {
              node.addNewArrayGetAndConnect(
                rowMenu.cell[1] - 1,
                rowObjectsNames,
              );
              setRowMenu(undefined);
            }}
            disabled={rowMenu?.cell?.[1] === 0}
          >
            <ListItemIcon>
              <EastIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Get row data (as object)</ListItemText>
          </MenuItem>
          <Divider />
          <MenuItem
            onClick={() => {
              addRowToArrayOfArrays(arrayOfArrays, rowMenu.cell[1]);
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
              addRowToArrayOfArrays(arrayOfArrays, rowMenu.cell[1] + 1);
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
              removeRowFromArrayOfArrays(arrayOfArrays, rowMenu.cell[1]);
              setRowMenu(undefined);
            }}
          >
            <ListItemIcon>
              <DeleteIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Delete row</ListItemText>
          </MenuItem>
        </Menu>
      </Box>
    );
  }

  createWorkBookFromJSON(json): any {
    const module = this.getXLSXModule();
    const workBook = module.utils.book_new();
    json.SheetNames.forEach(function (name) {
      module.utils.book_append_sheet(workBook, json.Sheets[name], name);
    });
    return workBook;
  }

  getSheet(): XLSX.WorkSheet {
    return this.workBook.Sheets[this.workBook.SheetNames[this.getIndex()]];
  }

  getIndex(): number {
    return limitRange(
      this.getInputData(sheetIndexInputSocketName),
      0,
      this.workBook.SheetNames.length - 1,
    );
  }

  getJSON(sheet: XLSX.WorkSheet): any {
    console.time('get_json');
    const data = this.getXLSXModule().utils.sheet_to_json(sheet);
    console.timeEnd('get_json');
    return data;
  }

  getArrayOfArrays(sheet: XLSX.WorkSheet): any {
    console.time('get_array_of_arrays');
    const data = this.getXLSXModule().utils.sheet_to_json(sheet, {
      header: 1,
    });
    console.timeEnd('get_array_of_arrays');
    return data;
  }

  getCSV(sheet: XLSX.WorkSheet): any {
    const data = this.getXLSXModule().utils.sheet_to_csv(sheet);
    return data;
  }

  setAllOutputData(): any {
    console.time('set_output_data');
    this.getOutputSocketByName(rowObjectsNames).valueNeedsRefresh();
    this.getOutputSocketByName(arrayOfArraysSocketName).valueNeedsRefresh();
    console.timeEnd('set_output_data');
    this.executeChildren();
  }

  public getDynamicImports(): string[] {
    return ['xlsx'];
  }
}
