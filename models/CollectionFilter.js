import fs from "fs";
import { v1 as uuidv1 } from "uuid";
import * as utilities from "../utilities.js";
import { log } from "../log.js";



// NOTE: Name est remplacé par Title

// Exemple: /api/bookmarks?sort=Title,desc&Title=*e*&Category=Cloud&limit=5&offset=10


export default class CollectionFilter {
  constructor(data, params, model) {
    this.data = data;
    this.params = params;
    this.model = model;
  }

  get() {
  let filteredData = this.data;
  let uniqueCategories = new Set();

  if (this.params) {
    if (this.params.sort) {
      const [fieldName, order] = this.params.sort.split(",");
      filteredData = this.sortData(filteredData, fieldName, order);
    }

    Object.keys(this.params).forEach((field) => {
      if (
        field !== "sort" &&
        field !== "limit" &&
        field !== "offset" &&
        field !== "field"
      ) {
        filteredData = this.filterDataByField(
          filteredData,
          field,
          this.params[field]
        );

      }
    });

    if (this.params.limit && this.params.offset) {
      const limit = parseInt(this.params.limit);
      const offset = parseInt(this.params.offset);
      filteredData = this.paginate(limit, offset);
    }

    if (this.params.field) {
      if (this.params.field === "Category") {
        // Return unique Category values when field is Category
        filteredData = this.getUniqueCategories();
      } else {
        const fieldsToDisplay = this.params.field.split(",");
        filteredData = this.displayFields(filteredData, fieldsToDisplay);
      }
    }
  }

  return filteredData;
}


  // Title filters
  
  filterDataByName(data, filter) {
    return data.filter((item) => {
      const value = item["Title"].toString().toLowerCase();
      if (filter.startsWith("*") && filter.endsWith("*")) {
        const substring = filter.slice(1, -1);
        return value.includes(substring);
      } else if (filter.startsWith("*")) {
        const suffix = filter.slice(1);
        return value.endsWith(suffix);
      } else if (filter.endsWith("*")) {
        const prefix = filter.slice(0, -1);
        return value.startsWith(prefix);
      } else {
        return value === filter;
      }
    });
  }


  

  // Other filters

  filterByField(fieldName, filter) {
    return this.data.filter((item) => item[fieldName] === filter);
  }

  sortData(data, fieldName, order) {
    return data.sort((a, b) => {
      const valueA = this.parseValue(a[fieldName]);
      const valueB = this.parseValue(b[fieldName]);
      const sortOrder = order === 'desc' ? -1 : 1;
      return (valueA - valueB) * sortOrder;
    });
  }

  parseValue(value) {
    const parsedValue = parseFloat(value);
    return isNaN(parsedValue) ? value : parsedValue;
  }

  paginate(limit, offset) {
    return this.data.slice(offset, offset + limit);
  }



  // Display fields
  
  getUniqueCategories() {
    const categories = this.data.map(item => item.Category);
    const uniqueCategories = [...new Set(categories)];
    const result = [];

    // Split categories into different JSON entries
    uniqueCategories.forEach(category => {
      if (category[0] === category[0].toUpperCase()) {
        result.push({ "nom": category });
      }
    });
    
     return result;
  }

  filterDataByField(data, fieldName, filter) {
    return data.filter((item) => {
      const value = item[fieldName].toString().toLowerCase();
      return this.valueMatch(value, filter);
    });
  }

  displayFields(data, fieldsToDisplay) {
    return data.map((item) => {
      const newItem = {};
      fieldsToDisplay.forEach((field) => {
        newItem[field] = item[field];
      });
      return newItem;
    });
  }

  
  // Given methods

  valueMatch(value, searchValue) {
    try {
      let exp = "^" + searchValue.toLowerCase().replace(/\*/g, ".*") + "$";
      return new RegExp(exp).test(value);
    } catch (error) {
      console.log(error);
      return false;
    }
  }

  compareNum(x, y) {
    if (x === y) return 0;
    else if (x < y) return -1;
    return 1;
  }

  innerCompare(x, y) {
    if (typeof x === "string") return x.localeCompare(y);
    else return this.compareNum(x, y);
  }
}
