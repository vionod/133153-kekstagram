'use strict';

(function() {
  /**
   * @constructor
   * @param {string} image
   */
  var Resizer = function(image) {
    // Изображение, с которым будет вестись работа.
    this._image = new Image();
    this._image.src = image;

    // Холст.
    this._container = document.createElement('canvas');
    this._ctx = this._container.getContext('2d');

    // Создаем холст только после загрузки изображения.
    this._image.onload = function() {
      // Размер холста равен размеру загруженного изображения. Это нужно
      // для удобства работы с координатами.
      this._container.width = this._image.naturalWidth;
      this._container.height = this._image.naturalHeight;

      /**
       * Предлагаемый размер кадра в виде коэффициента относительно меньшей
       * стороны изображения.
       * @const
       * @type {number}
       */
      var INITIAL_SIDE_RATIO = 0.75;

      // Размер меньшей стороны изображения.
      var side = Math.min(
          this._container.width * INITIAL_SIDE_RATIO,
          this._container.height * INITIAL_SIDE_RATIO);

      // Изначально предлагаемое кадрирование — часть по центру с размером в 3/4
      // от размера меньшей стороны.
      this._resizeConstraint = new Square(
          this._container.width / 2 - side / 2,
          this._container.height / 2 - side / 2,
          side);

      // Отрисовка изначального состояния канваса.
      this.setConstraint();
    }.bind(this);

    // Фиксирование контекста обработчиков.
    this._onDragStart = this._onDragStart.bind(this);
    this._onDragEnd = this._onDragEnd.bind(this);
    this._onDrag = this._onDrag.bind(this);
  };

  Resizer.prototype = {
    /**
     * Родительский элемент канваса.
     * @type {Element}
     * @private
     */
    _element: null,

    /**
     * Положение курсора в момент перетаскивания. От положения курсора
     * рассчитывается смещение на которое нужно переместить изображение
     * за каждую итерацию перетаскивания.
     * @type {Coordinate}
     * @private
     */
    _cursorPosition: null,

    /**
     * Объект, хранящий итоговое кадрирование: сторона квадрата и смещение
     * от верхнего левого угла исходного изображения.
     * @type {Square}
     * @private
     */
    _resizeConstraint: null,

    /**
     * Отрисовка канваса.
     */
    redraw: function() {
      // Очистка изображения.
      this._ctx.clearRect(0, 0, this._container.width, this._container.height);

      // Сохранение состояния канваса.
      // Подробней см. строку 132.
      this._ctx.save();

      // Установка начальной точки системы координат в центр холста.
      this._ctx.translate(this._container.width / 2, this._container.height / 2);

      var displX = -(this._resizeConstraint.x + this._resizeConstraint.side / 2);
      var displY = -(this._resizeConstraint.y + this._resizeConstraint.side / 2);
      // Отрисовка изображения на холсте. Параметры задают изображение, которое
      // нужно отрисовать и координаты его верхнего левого угла.
      // Координаты задаются от центра холста.
      this._ctx.drawImage(this._image, displX, displY);

      // Отрисовка тени изображения
      this._drawConstraintShadow(displX, displY);

      // Отрисовка обводки с типом Outline
      this._drawConstraintOutline(Outline.ZIGZAG);

      // Отрисовка текстового заголовка
      this._drawTextTitle();

      // Восстановление состояния канваса, которое было до вызова ctx.save
      // и последующего изменения системы координат. Нужно для того, чтобы
      // следующий кадр рисовался с привычной системой координат, где точка
      // 0 0 находится в левом верхнем углу холста, в противном случае
      // некорректно сработает даже очистка холста или нужно будет использовать
      // сложные рассчеты для координат прямоугольника, который нужно очистить.
      this._ctx.restore();
    },

    /**
     * Включение режима перемещения. Запоминается текущее положение курсора,
     * устанавливается флаг, разрешающий перемещение и добавляются обработчики,
     * позволяющие перерисовывать изображение по мере перетаскивания.
     * @param {number} x
     * @param {number} y
     * @private
     */
    _enterDragMode: function(x, y) {
      this._cursorPosition = new Coordinate(x, y);
      document.body.addEventListener('mousemove', this._onDrag);
      document.body.addEventListener('mouseup', this._onDragEnd);
    },

    /**
     * Выключение режима перемещения.
     * @private
     */
    _exitDragMode: function() {
      this._cursorPosition = null;
      document.body.removeEventListener('mousemove', this._onDrag);
      document.body.removeEventListener('mouseup', this._onDragEnd);
    },

    /**
     * Перемещение изображения относительно кадра.
     * @param {number} x
     * @param {number} y
     * @private
     */
    updatePosition: function(x, y) {
      this.moveConstraint(
          this._cursorPosition.x - x,
          this._cursorPosition.y - y);
      this._cursorPosition = new Coordinate(x, y);
    },

    /**
     * @param {MouseEvent} evt
     * @private
     */
    _onDragStart: function(evt) {
      this._enterDragMode(evt.clientX, evt.clientY);
    },

    /**
     * Обработчик окончания перетаскивания.
     * @private
     */
    _onDragEnd: function() {
      this._exitDragMode();
    },

    /**
     * Обработчик события перетаскивания.
     * @param {MouseEvent} evt
     * @private
     */
    _onDrag: function(evt) {
      this.updatePosition(evt.clientX, evt.clientY);
    },

    /**
     * Добавление элемента в DOM.
     * @param {Element} element
     */
    setElement: function(element) {
      if (this._element === element) {
        return;
      }

      this._element = element;
      this._element.insertBefore(this._container, this._element.firstChild);
      // Обработчики начала и конца перетаскивания.
      this._container.addEventListener('mousedown', this._onDragStart);
    },

    /**
     * Возвращает кадрирование элемента.
     * @return {Square}
     */
    getConstraint: function() {
      return this._resizeConstraint;
    },

    /**
     * Смещает кадрирование на значение указанное в параметрах.
     * @param {number} deltaX
     * @param {number} deltaY
     * @param {number} deltaSide
     */
    moveConstraint: function(deltaX, deltaY, deltaSide) {
      this.setConstraint(
          this._resizeConstraint.x + (deltaX || 0),
          this._resizeConstraint.y + (deltaY || 0),
          this._resizeConstraint.side + (deltaSide || 0));
    },

    /**
     * @param {number} x
     * @param {number} y
     * @param {number} side
     */
    setConstraint: function(x, y, side) {
      if (typeof x !== 'undefined') {
        this._resizeConstraint.x = x;
      }

      if (typeof y !== 'undefined') {
        this._resizeConstraint.y = y;
      }

      if (typeof side !== 'undefined') {
        this._resizeConstraint.side = side;
      }

      requestAnimationFrame(function() {
        this.redraw();
        window.dispatchEvent(new CustomEvent('resizerchange'));
      }.bind(this));
    },

    /**
     * Удаление. Убирает контейнер из родительского элемента, убирает
     * все обработчики событий и убирает ссылки.
     */
    remove: function() {
      this._element.removeChild(this._container);

      this._container.removeEventListener('mousedown', this._onDragStart);
      this._container = null;
    },

    /**
     * Экспорт обрезанного изображения как HTMLImageElement и исходником
     * картинки в src в формате dataURL.
     * @return {Image}
     */
    exportImage: function() {
      // Создаем Image, с размерами, указанными при кадрировании.
      var imageToExport = new Image();

      // Создается новый canvas, по размерам совпадающий с кадрированным
      // изображением, в него добавляется изображение взятое из канваса
      // с измененными координатами и сохраняется в dataURL, с помощью метода
      // toDataURL. Полученный исходный код, записывается в src у ранее
      // созданного изображения.
      var temporaryCanvas = document.createElement('canvas');
      var temporaryCtx = temporaryCanvas.getContext('2d');
      temporaryCanvas.width = this._resizeConstraint.side;
      temporaryCanvas.height = this._resizeConstraint.side;
      temporaryCtx.drawImage(this._image,
          -this._resizeConstraint.x,
          -this._resizeConstraint.y);
      imageToExport.src = temporaryCanvas.toDataURL('image/png');

      return imageToExport;
    },

    _drawConstraintShadow: function(x, y) {
      // Отрисовка фигуры, затеняющей изоражение.
      // Реализована по принципу заливки evenodd

      // Внешняя граница фона
      this._ctx.beginPath();
      this._ctx.moveTo(x, y);
      this._ctx.lineTo(x + this._container.width, y);
      this._ctx.lineTo(x + this._container.width, y + this._container.height);
      this._ctx.lineTo(x, y + this._container.height);
      this._ctx.lineTo(x, y);

      // Установка координат кадрируемого изображения
      var constraintCrop = new Rectangle(Math.min(Math.max(-this._resizeConstraint.side / 2, x), x + this._container.width),
          Math.min(Math.max(-this._resizeConstraint.side / 2, y), y + this._container.height),
          Math.min(Math.max(this._resizeConstraint.side / 2, x), x + this._container.width),
          Math.min(Math.max(this._resizeConstraint.side / 2, y), y + this._container.height)
        );

      // Пересечение с областью, кадрируемого изображения,
      // которое не треьуется затенять.
      this._ctx.moveTo(constraintCrop.x1, constraintCrop.y1);
      this._ctx.lineTo(constraintCrop.x2, constraintCrop.y1);
      this._ctx.lineTo(constraintCrop.x2, constraintCrop.y2);
      this._ctx.lineTo(constraintCrop.x1, constraintCrop.y2);
      this._ctx.lineTo(constraintCrop.x1, constraintCrop.y1);
      this._ctx.fillStyle = 'rgba(0, 0, 0, .8)';
      this._ctx.fill('evenodd');
    },

    _drawConstraintOutline: function(outline, fillStyle) {
      var i, j;
      var STEP_SIZE = 6;
      var rect = new Rectangle((-this._resizeConstraint.side / 2) - STEP_SIZE / 2, (-this._resizeConstraint.side / 2) - STEP_SIZE / 2,
            this._resizeConstraint.side / 2 + STEP_SIZE / 2, this._resizeConstraint.side / 2 + STEP_SIZE / 2);

      // Установка типа обводки по-умолчанию
      if (!outline) {
        outline = Outline.DEFAULT;
      }

      // Установка цвета заливки по-умолчанию
      if (!fillStyle) {
        fillStyle = '#ffe753';
      }

      // Установка координат вершин рамки
      // rect((-this._resizeConstraint.side / 2) - STEP_SIZE / 2, (-this._resizeConstraint.side / 2) - STEP_SIZE / 2,
      //       this._resizeConstraint.side / 2 + STEP_SIZE / 2, this._resizeConstraint.side / 2 + STEP_SIZE / 2);

      switch (outline) {
        case Outline.DEFAULT:
          // Толщина линии.
          this._ctx.lineWidth = STEP_SIZE;
          // Размер штрихов. Первый элемент массива задает длину штриха, второй
          // расстояние между соседними штрихами.
          this._ctx.setLineDash([15, 10]);
          // Смещение первого штриха от начала линии.
          this._ctx.lineDashOffset = 7;
          // Установка цвета обводки
          this._ctx.strokeStyle = fillStyle;

          // Отрисовка прямоугольника, обозначающего область изображения после
          // кадрирования. Координаты задаются от центра.
          this._ctx.strokeRect(rect.x1, rect.y1, rect.width, rect.height);
          break;
        case Outline.DOTTED:
          // Установка цвета заливки
          this._ctx.fillStyle = fillStyle;

          // циклы для перебора сторон квадрата
          for (i = 1; i <= 2; i++) {
            for (j = 1; j <= 2; j++) {
              // (3 - j) - возвращает противоположное значение: 1 при j=2, и 2 при j=1
              // из верхней левой точки вправо и вниз, и из нижней правой - влево и вверх
              // так, чтобы начальные точки двух сторон наложились, ибыло всего 2 "дырки
              this._drawDottedLine(rect['x' + i], rect['y' + i], rect['x' + (3 - j)], rect['y' + j], STEP_SIZE);
            }
          }
          break;
        case Outline.ZIGZAG:
          // Толщина линии.
          this._ctx.lineWidth = STEP_SIZE / 2;
          // Установка цвета обводки
          this._ctx.strokeStyle = fillStyle;

          // циклы для перебора сторон квадрата
          for (i = 1; i <= 2; i++) {
            for (j = 1; j <= 2; j++) {
              // (3 - j) - возвращает противоположное значение: 1 при j=2, и 2 при j=1
              // из верхней левой точки по часовой стрелке
              this._drawZigZagLine(rect['x' + i], rect['y' + j], rect['x' + (3 - j)], rect['y' + i], STEP_SIZE);
            }
          }
          break;
      }
    },

    _drawZigZagLine: function(x1, y1, x2, y2, step) {
      var x, y, stepX, stepY, i = false;
      stepX = (x2 >= x1 ? 1 : -1) * (x2 !== x1); // направление зигазага по X: 1, -1, либо 0
      stepY = (y2 >= y1 ? 1 : -1) * (y2 !== y1); // направление зигазага по Y: 1, -1, либо 0
      this._ctx.beginPath();
      this._ctx.moveTo(x1, y1);

      // цикл прироста координаты x выполнятся только 1 раз, когда прирост идёт по Y,
      // и с шагом step от x1 до x2, когда по X
      x = x1;
      do {

        y = y1;

        // цикл прироста координаты y выполнятся только 1 раз, когда прирост идёт по X,
        // и с шагом step от y1 до y2, когда по Y
        do {

          // координаты x и y рисуемой линии изменяются линейно циклом (в этом случае !stepX и !stepY
          // обнуляют второе слагаемое выражения), либо зигзагообразно (на 1 или 0 шагов) на шаг step
          // со знаком, зависящим от направления (-stepX) и stepY соответственно
          this._ctx.lineTo(x + step * i * (-stepY) * !stepX, y + step * i * stepX * !stepY);

          i = !i; // переменная отвечающая за текущее направление зигзага, равно либо 1 (true), либо 0 (false)
          y += step * stepY;
        } while (Math.abs(y2 - y) >= step);
        x += step * stepX;
      } while (Math.abs(x2 - x) >= step);
      this._ctx.stroke();
    },

    _drawDottedLine: function(x1, y1, x2, y2, step) {
      var x, y, stepX, stepY;
      stepX = (x2 >= x1 ? 1 : -1) * (x2 !== x1); // направление зигазага по X: 1, -1, либо 0
      stepY = (y2 >= y1 ? 1 : -1) * (y2 !== y1); // направление зигазага по Y: 1, -1, либо 0
      this._ctx.beginPath();

      // цикл прироста координаты x выполнятся только 1 раз, когда прирост идёт по Y,
      // и с шагом step от x1 до x2, когда по X
      x = x1;
      do {

        y = y1;

        // цикл прироста координаты y выполнятся только 1 раз, когда прирост идёт по X,
        // и с шагом step от y1 до y2, когда по Y
        do {
          this._ctx.arc(x, y, step / 2, 0, 2 * Math.PI);
          y += step * stepY * 2;
        } while (Math.abs(y) <= Math.abs(y2) - step);
        x += step * stepX * 2;
      } while (Math.abs(x) <= Math.abs(x2) - step);
      this._ctx.fill();
    },

    _drawTextTitle: function() {
      // Вывод текста
      this._ctx.fillStyle = 'white';
      this._ctx.font = '14px Arial';
      this._ctx.textBaseline = 'bottom';
      this._ctx.textAlign = 'center';
      this._ctx.fillText('Ширина изображения: ' + this._image.naturalWidth + 'px, высота: ' + this._image.naturalHeight + 'px', 0, -this._resizeConstraint.side / 2 - 10);
    }
  };

  /**
   * Вспомогательный тип, описывающий квадрат.
   * @constructor
   * @param {number} x
   * @param {number} y
   * @param {number} side
   * @private
   */
  var Square = function(x, y, side) {
    this.x = x;
    this.y = y;
    this.side = side;
  };

  /**
   * Вспомогательный тип, описывающий прямоугольник.
   * @constructor
   * @param {number} x1
   * @param {number} y1
   * @param {number} width
   * @param {number} height
   * @private
   */
  var Rectangle = function(x1, y1, x2, y2) {
    this.x1 = x1;
    this.y1 = y1;
    this.x2 = x2;
    this.y2 = y2;
    this.width = x2 - x1;
    this.height = y2 - y1;
  };

  /**
   * Вспомогательный тип, описывающий тип рамки.
   * @enum {number} */
  var Outline = {
    DEFAULT: 0,
    DOTTED: 1,
    ZIGZAG: 2
  };

  /**
   * Вспомогательный тип, описывающий координату.
   * @constructor
   * @param {number} x
   * @param {number} y
   * @private
   */
  var Coordinate = function(x, y) {
    this.x = x;
    this.y = y;
  };

  window.Resizer = Resizer;
})();
