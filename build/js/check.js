var sum = function (a) {
  var result = 0;
  for (var i=0; i < a.length; i++) {
    result += a[i];
  }
  return result;
}

var square = function (a, b) {
  var result = 0;
  for (var i=0; i < a.length && i < b.length; i++) {
    result += a[i] * b[i];
  }
  return result;
}

var getMessage = function (a, b) {

if (typeof a == "boolean") {
  if (a) {
    return "Переданное GIF-изображение анимировано и содержит " + b + " кадров";
  } else {
    return "Переданное GIF-изображение не анимировано";
  }
} else if (typeof a == "number") {
  return "Переданное SVG-изображение содержит " + a + " объектов и " + b * 4 + " атрибутов";
} else if (Array.isArray(a) && !Array.isArray(b)) {

  return "Количество красных точек во всех строчках изображения: " + sum(a);
} else if (Array.isArray(a) && Array.isArray(b)) {

  return "Общая площадь артефактов сжатия: " + square(a,b) + " пикселей";
}

}
