export var pen_formatter = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
});

export var sun_currency_formatter = {
  formatter: "money",
  formatterParams: {
    decimal: ".",
    thousand: ",",
    symbol: "S/ ",
    negativeSign: true,
  },
};

export const percent_formatter = (value, precision) => (value * 100).toFixed(precision) + "%";

export var make_round_formatter = function (precision) {
  return function (cell, formatterParams, onRendered) {
    //cell - the cell component
    //formatterParams - parameters set for the column
    //onRendered - function to call when the formatter has been rendered
    const value = parseFloat(cell.getValue());
    return isNaN(value) ? value : value.toFixed(precision); //return the contents of the cell;
  };
};

export var make_percent_formatter = function (precision) {
  return function (cell, formatterParams, onRendered) {
    //cell - the cell component
    //formatterParams - parameters set for the column
    //onRendered - function to call when the formatter has been rendered
    const value = parseFloat(cell.getValue());
    return isNaN(value) ? cell.getValue() : percent_formatter(value, precision); //return the contents of the cell;
  };
};

export var tree_currency_formater = {
  formatter: function (cell, formatterParams, onRendered) {
    //cell - the cell component
    //formatterParams - parameters set for the column
    //onRendered - function to call when the formatter has been rendered
    let isParent = false;
    if (cell.getRow()._row.type !== "calc") {
      isParent = cell.getRow().getData().type?.startsWith("parent");
    }
    const value = cell.getValue();
    if (isParent) {
      return pen_formatter.format(isNaN(value) ? 0 : value); //return the contents of the cell;
    } else {
      return cell.getValue();
    }
  },
};

export var bold_formatter = (...rows) => {
  return {
    formatter: function (cell, formatterParams, onRendered) {
      //cell - the cell component
      //formatterParams - parameters set for the column
      //onRendered - function to call when the formatter has been rendered
      const bold = rows.some((row) => {
        if (cell.getRow()._row.type !== "calc") {
          return cell.getRow().getIndex() === row;
        } else {
          return false;
        }
      });
      if (rows.length == 0 || bold) {
        return `<b>${cell.getValue() ?? ""}</b>`; //return the contents of the cell;
      } else {
        return cell.getValue();
      }
    },
  };
};
