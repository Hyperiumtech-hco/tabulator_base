import { sun_currency_formatter, make_percent_formatter } from "./formatters.js";

export function* recursiveColumnLeafIterator(colDef) {
  if (!colDef.columns) {
    yield colDef;
  } else {
    for (let item of colDef.columns) {
      yield* recursiveColumnLeafIterator(item);
    }
  }
}

export function* recursiveColumnIterator(colDef) {
  if (colDef.columns) {
    yield colDef;
    for (const column of colDef.columns) {
      yield* recursiveColumnIterator(column);
    }
  }
}

export function linkMutators(tblModel) {
  for (const column of recursiveColumnLeafIterator(tblModel.config)) {
    Object.entries(tblModel.mutators ?? {}).forEach(([mutator, { deps, mutator: mutate }]) => {
      if (column.field === mutator) {
        column.mutator = (value, data, type, params, component) => {
          const result = mutate(value, data, type, params, component);
          return Number.isNaN(result) ? undefined : result;
        };
      }
      if (deps?.includes(column.field)) {
        column.mutateLink ??= [];
        if (!column.mutateLink.includes(mutator)) {
          column.mutateLink.push(mutator);
        }
      }
    });
  }
}

export function insertColumns(tblModel, insertColumn, columnModel, start, end, maxColumns) {
  const columnIterator = recursiveColumnIterator(tblModel.config);
  let columnDefinition;
  for (columnDefinition = columnIterator.next(); !columnDefinition.done; columnDefinition = columnIterator.next()) {
    if (columnDefinition.value.columns === insertColumn) {
      break;
    }
  }

  const beginColumns = insertColumn.slice(0, start);
  const endColumns = insertColumn.slice(end);

  const newColumns = [];
  for (let index = 1; index <= maxColumns; index++) {
    let colModel = columnModel;
    if (typeof columnModel === "function") {
      colModel = columnModel(index);
    }
    newColumns.push(colModel.config);
    tblModel.mutators ??= {};
    Object.assign(tblModel.mutators, colModel.mutators ?? {});
  }

  columnDefinition.value.columns = [...beginColumns, ...newColumns, ...endColumns];

  linkMutators(tblModel);
}

export const total_column = {
  bottomCalc: "sum",
  bottomCalcFormatter: "money",
  bottomCalcFormatterParams: sun_currency_formatter.formatterParams,
};

export const total_precent_column = {
  bottomCalc: "sum",
  bottomCalcFormatter: make_percent_formatter(2),
};

export const partial_total_column = (start, end) => {
  return {
    ...total_column,
    bottomCalc: function (values, data, calcParams) {
      let calc = 0.0;
      values.slice(start, end).forEach(function (value) {
        value = parseFloat(value);
        calc += isNaN(value) ? 0 : value;
      });
      return calc.toFixed(calcParams.precision);
    },
  };
};

export function treeSum(row, field) {
  const value = row[field];
  return (
    (isNaN(value) ? 0 : value) +
    (row._children?.reduce((acc, r) => {
      return acc + treeSum(r, field);
    }, 0) ?? 0)
  );
}

export const total_tree_column = (field) => {
  return {
    ...total_column,
    bottomCalc: function (values, data, calcParams) {
      return treeSum({ _children: data }, field);
    },
  };
};

export const total_field_column = (field) => {
  return {
    ...total_column,
    bottomCalc: function (values, data, calcParams) {
      return data.reduce((acc, row) => {
        return acc + (row[field] ?? 0);
      }, 0);
    },
  };
};

export const calcTitle = (title) => {
  return (values, data, calcParams) => {
    return title;
  };
};

export const makeEditableCells = (...rows) => {
  return {
    editable: function (cell) {
      return rows.some(function (row) {
        if (cell.getRow()._row.type !== "calc") {
          return cell.getRow().getIndex() === row;
        } else {
          return false;
        }
      });
    },
  };
};

export function getColumns(id) {
  const value = parseInt(document.getElementById(id).value);
  return isNaN(value) ? 1 : value;
}

export function getData(table) {
  const data = table.getData();
  if (table.spareRow) {
    data.pop();
  }
  return data;
}

export function filterColumns(data, start, end) {
  return data
    .filter((row) => row.spare === undefined)
    .map((row) => Object.fromEntries(Object.entries(row).slice(start, end)));
}

export async function deleteAllRows(table) {
  const rows = table.getRows();
  const deletePromises = rows.map((row) => row.delete());
  await Promise.all(deletePromises);
}
