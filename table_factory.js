import { linkMutators } from "./table.js";
import { recursiveColumnLeafIterator } from "./table.js";

//IDEA: use field to do calculations example
// the formulas model its inmutable
/* const formulas = {
  "field1": (cell) {
    calculateTotal();
  }
} */

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

export function createSpreeadSheetTable(tableModel) {
  const spareRow = tableModel.spareRow ?? false;
  const config = { ...defaultConfig, ...tableModel.config };

  linkMutators(tableModel);
  for (const column of recursiveColumnLeafIterator(tableModel.config)) {
    let isEditable = false;
    if (typeof column.editable === "function") {
      isEditable = column.editable(cell);
    } else {
      isEditable = column.editor !== undefined;
    }
    if (!isEditable) {
      column.cellEdited = function (cell) {
        cell.restoreOldValue();
      }
    }
  }
  const table = new Tabulator(tableModel.id, config);

  table.on("cellEdited", function (cell) {
    const lastIndex = table.getRows().length - 1;
    if (spareRow && lastIndex === rowPos) {
      table.addRow({});
    }
  });

  table.on("rowAdded", function (row) {
    const lastIndex = table.getRows().length;
    row.update({ id: lastIndex });
  });

  // TODO: controller subscribe to table events
  // TODO: mutator to cancel noneditable Cells
  table.on("clipboardPasted", function (clipboard, rowData, rows) {
    let index = 0;
    if (rowData.length > rows.length && spareRow) {
      table.addRow(rowData.slice(index));
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
