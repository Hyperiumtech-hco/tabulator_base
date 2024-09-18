import { linkMutators } from "./table.js";
import { recursiveColumnLeafIterator } from "./table.js";

const clearValue = {};
// TODO: auto column group names
// TODO: delete spare row on sort
const defaultConfig = {
  editTriggerEvent:"click", //trigger edit on double click
  placeholder: "Sin Datos", //display message to user on empty table
  layout: "fitDataFill",
  layoutColumnsOnNewData: true,
  columnHeaderVertAlign: "middle", //align header contents to bottom of cell
  //enable range selection
  headerSortClickElement: "icon",
  selectableRange: 1,
  selectableRangeColumns: false,
  /* selectableRangeRows: true, */
  selectableRangeClearCells: true,
  selectableRangeClearCellsValue: clearValue,
  clipboardPasteParser: function (clipboard) {
    var data = [],
      rows = [],
      range = this.table.modules.selectRange.activeRange,
      singleCell = false,
      bounds,
      startCell,
      colWidth,
      columnMap,
      startCol;

    if (range) {
      bounds = range.getBounds();
      startCell = bounds.start;

      if (bounds.start === bounds.end) {
        singleCell = true;
      }

      if (startCell) {
        //get data from clipboard into array of columns and rows.
        clipboard = clipboard.split("\n");

        clipboard.forEach(function (row) {
          data.push(row.split("\t"));
        });

        if (data.length) {
          columnMap = this.table.columnManager.getVisibleColumnsByIndex();
          startCol = columnMap.indexOf(startCell.column);

          if (startCol > -1) {
            if (singleCell) {
              colWidth = data[0].length;
            } else {
              colWidth = columnMap.indexOf(bounds.end.column) - startCol + 1;
            }

            columnMap = columnMap.slice(startCol, startCol + colWidth);

            data.forEach((item) => {
              var row = {};
              var itemLength = item.length;

              columnMap.forEach(function (col, i) {
                row[col.field] = item[i % itemLength];
              });

              rows.push(row);
            });

            return rows;
          }
        }
      }
    }

    return false;
  },
  clipboardPasteAction: function (data) {
    var rows = [],
      range = this.table.modules.selectRange.activeRange,
      singleCell = false,
      bounds,
      startCell,
      startRow,
      rowWidth,
      dataLength;

    dataLength = data.length;

    if (range) {
      bounds = range.getBounds();
      startCell = bounds.start;

      if (bounds.start === bounds.end) {
        singleCell = true;
      }

      if (startCell) {
        const flattenTree = (arr, row) => {
          arr.push(row._row);
          if (row.getTreeChildren()) {
            return row.getTreeChildren().reduce(flattenTree, arr);
          } else {
            return arr;
          }
        };
        const flattenParent = (arr, row) => {
          arr.push(row);
          if (row.component.getTreeChildren()) {
            return row.component.getTreeChildren().reduce(flattenTree, arr);
          } else {
            return arr;
          }
        };
        rows = this.table.rowManager.activeRows.slice();
        if (this.table.options.dataTree) {
          rows = rows.reduce(flattenParent, []);
        }

        startRow = rows.indexOf(startCell.row);

        if (singleCell) {
          rowWidth = data.length;
        } else {
          rowWidth = rows.indexOf(bounds.end.row) - startRow + 1;
        }

        if (startRow > -1) {
          this.table.blockRedraw();

          rows = rows.slice(startRow, startRow + rowWidth);

          rows.forEach((row, i) => {
            const dataObj = data[i % dataLength];
            const dataToUpdate = Object.keys(dataObj)
              .filter((key) => {
                const cell = row.getCell(key);
                return isCellEditable(cell.component);
              })
              .reduce((obj, key) => {
                obj[key] = dataObj[key];
                return obj;
              }, {});
            row.updateData(dataToUpdate);
          });

          this.table.restoreRedraw();
        }
      }
    }

    return rows;
  },
  //change edit trigger mode to make cell navigation smoother
  editTriggerEvent: "dblclick",
  history: true,
  //configure clipboard to allow copy and paste of range format data
  clipboard: true,
  clipboardCopyConfig: {
    columnHeaders: false, //do not include column headers in clipboard output
    columnGroups: false, //do not include column groups in column headers for printed table
    rowHeaders: false, //do not include row headers in clipboard output
    rowGroups: false, //do not include row groups in clipboard output
    columnCalcs: false, //do not include column calculation rows in clipboard output
    dataTree: false, //do not include data tree in printed table
    formatCells: false, //show raw cell values without formatter
  },
  clipboardCopyStyled: false,
  clipboardCopyRowRange: "range",
  columnDefaults: {
    hozAlign: "center",
    vertAlign: "middle",
    headerHozAlign: "center",
    headerWordWrap: true,
    resizable: true,
  },
};

function isCellEditable(cell) {
  let isEditable = false;
  const column = cell.getColumn();
  const columnDef = column.getDefinition();
  if (typeof columnDef.editable === "function") {
    isEditable = columnDef.editable(cell);
  } else {
    isEditable = columnDef.editor !== undefined;
  }
  return isEditable;
}

export function createSpreeadSheetTable(tableModel) {
  const spareRow = tableModel.spareRow ?? false;
  const columnDefaults = tableModel.config.columnDefaults ?? {};
  defaultConfig.columnDefaults = {
    ...defaultConfig.columnDefaults,
    ...columnDefaults,
  };
  delete tableModel.config.columnDefaults;
  const config = { ...defaultConfig, ...tableModel.config };
  tableModel.config.columnDefaults = columnDefaults;
  let rowIndex = 0;
  linkMutators(tableModel);

  const table = new Tabulator(tableModel.id, config);

  table.on("cellEdited", function (cell) {
    if (cell.getValue() === clearValue) {
      if (!isCellEditable(cell)) {
        cell.restoreOldValue();
        return;
      } else {
        const row = cell.getRow();
        row.update({ [cell.getField()]: "" });
      }
    }

    const lastIndex = table.getRows().length;
    if (spareRow && lastIndex === cell.getRow().getPosition()) {
      table.addRow({});
    }
  });

  table.on("rowAdded", function (row) {
    const nextIndex = ++rowIndex;
    row.update({ id: nextIndex });
  });

  table.on("clipboardPasted", function (clipboard, rowData, rows) {
    if (rowData.length > rows.length && spareRow) {
      table.addRow(rowData.slice(rows.length));
      table.addRow({});
    }
  });

  table.on("tableBuilt", function () {
    if (tableModel.data !== undefined) {
      table.addRow(tableModel.data);
      table.clearHistory();
    }
    if (spareRow) {
      table.addRow({});
    }
  });
  table["spareRow"] = spareRow;
  const spreadSheet = {
    tabulator: table,
    spareRow: spareRow,
  };
  return table;
}
