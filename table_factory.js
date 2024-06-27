import { linkMutators } from "./table.js";
import { recursiveColumnLeafIterator } from "./table.js";

//IDEA: use field to do calculations example
// the formulas model its inmutable
/* const formulas = {
  "field1": (cell) {
    calculateTotal();
  }
} */

const clearValue = {};
// TODO: auto column names
// TODO: delete spare row on sort
// TODO: undo/redo update formulas
const defaultConfig = {
  /* renderHorizontal:"virtual", */
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
  /* rowHeader: {resizable: false, frozen: true, width:40, hozAlign:"center", formatter: "rownum", field:"rownum", accessorClipboard:"rownum"}, */
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
  clipboardPasteParser: "range",
  clipboardPasteAction: "range",
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
  const config = { ...defaultConfig, ...tableModel.config };
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
    row.update({ id: ++rowIndex });
  });

  table.on("clipboardPasted", function (clipboard, rowData, rows) {
    if (rowData.length > rows.length && spareRow) {
      table.addRow(rowData.slice(rows.length));
      table.addRow({});
    }
  });

  table.on("tableBuilt", function () {
    if (config.clipboardPasteParser === "range") {
      const rangeParser = table.modules.clipboard.pasteParser.bind(table.modules.clipboard);
      table.modules.clipboard.setPasteParser(function (clipboard) {
        if (clipboard.endsWith("\n") || clipboard.endsWith("\r")) {
          clipboard = clipboard.slice(0, -1);
        }
        return rangeParser(clipboard);
      });
    }
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
