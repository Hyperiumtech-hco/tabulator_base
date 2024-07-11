export const lt_dia_formatter = (value) => {
  return `${isNaN(parseFloat(value)) ? 0 : value.toFixed(2)} Lt / dia`;
};

export const lt_per_dia_formatter = (value) => {
  return `${isNaN(parseFloat(value)) ? 0 : value.toFixed(2)} Lt x per / dia`;
};

export const lt_m2_dia_formatter = (value) => {
  return `${isNaN(parseFloat(value)) ? 0 : value.toFixed(2)} Lt x m2 / dia`;
};

export const m3_formatter = (value) => {
  return `${isNaN(parseFloat(value)) ? 0 : value.toFixed(2)} m3`;
};

export const m3_h_formatter = (value) => {
  return `${isNaN(parseFloat(value)) ? 0 : value.toFixed(2)} m3/h`;
};

export const m2_formatter = (value) => {
  return `${isNaN(parseFloat(value)) ? 0 : value.toFixed(2)} m2`;
};

export const m_formatter = (value) => {
  return `${isNaN(parseFloat(value)) ? 0 : value.toFixed(2)} m`;
};

export const m_sign_formatter = (value) => {
  return `${isNaN(parseFloat(value)) ? 0 : `${value >= 0 ? "+" : ""}${value.toFixed(2)}`} m`;
};

export const lt_formatter = (value) => {
  return `${isNaN(parseFloat(value)) ? 0 : value.toFixed(3)} L`;
}

export const ls_formatter = (value) => {
  return `${isNaN(parseFloat(value)) ? 0 : value.toFixed(2)} L/s`;
}

export const h_formatter = (value) => {
  return `${isNaN(parseFloat(value)) ? 0 : value.toFixed(2)} hrs`;
}

export const pulg_formatter = (value) => {
  return `${isNaN(parseFloat(value)) ? 0 : value.toFixed(2)} pulg`;
}

export const pen_formatter = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
});

export const sun_currency_formatter = {
  formatter: "money",
  formatterParams: {
    decimal: ".",
    thousand: ",",
    symbol: "S/ ",
    negativeSign: true,
  },
};

export const percent_formatter = (value, precision) => (value * 100).toFixed(precision) + "%";

export const make_lt_dia_formatter = function (precision) {
  return function (cell, formatterParams, onRendered) {
    const value = parseFloat(cell.getValue());
    return isNaN(value) ? "" : lt_dia_formatter(cell.getValue());
  };
};

export const make_lt_per_dia_formatter = function (precision) {
  return function (cell, formatterParams, onRendered) {
    const value = parseFloat(cell.getValue());
    return isNaN(value) ? "" : lt_per_dia_formatter(cell.getValue());
  };
};

export const make_lt_m2_dia_formatter_formatter = function (precision) {
  return function (cell, formatterParams, onRendered) {
    const value = parseFloat(cell.getValue());
    return isNaN(value) ? "" : lt_m2_dia_formatter(cell.getValue());
  };
};

export const make_round_formatter = function (precision) {
  return function (cell, formatterParams, onRendered) {
    //cell - the cell component
    //formatterParams - parameters set for the column
    //onRendered - function to call when the formatter has been rendered
    const value = parseFloat(cell.getValue());
    return isNaN(value) ? "" : value.toFixed(precision); //return the contents of the cell;
  };
};

export const make_percent_formatter = function (precision) {
  return function (cell, formatterParams, onRendered) {
    //cell - the cell component
    //formatterParams - parameters set for the column
    //onRendered - function to call when the formatter has been rendered
    const value = parseFloat(cell.getValue());
    return isNaN(value) ? cell.getValue() : percent_formatter(value, precision); //return the contents of the cell;
  };
};

export const tree_currency_formater = {
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

export const bold_formatter = (...rows) => {
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
