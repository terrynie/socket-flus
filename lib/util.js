function mergeSort(arr) {
  let length = arr.length;
  if (length < 2) {
    return arr;
  } else {
    let left = arr.splice(0, Math.floor(arr.length/2));
    return merge(mergeSort(left), mergeSort(arr));
  }
}

function merge(left, right) {
  let result = [];
  while(left.length > 0 || right.length > 0) {
    if (left.length > 0 && right.length > 0) {
      result.push(left[0] > right[0] ? right.shift() : left.shift());
    } else if (!left.length) {
      result = result.concat(right);
      right = [];
    } else {
      result = result.concat(left);
      left = [];
    }
  }
  return result;
}

function sum(arr) {
  let sum = 0;
  arr.forEach((item) => sum += item);
  return sum;
}

function filterBySecond() {
  let that = this;
  let _arr = [];
  let _obj = {};
  let _result = [];
  Object.keys(that).forEach((item) => {
    _arr = _arr.concat(that[item]);
  });
  _arr.forEach((item) => {
    _obj[item.toString().substring(0, 10)] = _obj[item.toString().substring(0, 10)] + 1 || 1;
  });
  Object.keys(_obj).forEach((item) => {
    _result.push(_obj[item]);
  });
  return _result;
}

function sleep(time) {
  let start = Date.now();
  while(Date.now() - start < time){};
}

module.exports = {
  filterBySecond,
  mergeSort,
  sleep,
  sum
}