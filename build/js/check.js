
function square(a, b) {
	  var length = Math.min(a.length, b.length); 
	  var result = 0;
	
		for (var i = 0; i < length; i++) {
				result  =result + (a[i] * b[i]);
		};
		return result;
};

function sum(a) {
		var result = 0;
	
		for(var i = 0; i < a.length; i++) {
				result = result + a[i];
		};
		return result;
};

function getMessage(a, b) {
	
  if (typeof(a) == 'boolean') {
			  if (a) {
            return 'Переданное изображение анимированно и содержит '+ b + ' кадров'};
		
        return 'Переданное GIF-изображение не анимированно';
            
    }
	else
				if ( (typeof(a) == 'number') &&  !isNaN(a) ) {
            return 'Переданное SVG-изображение содержит ' + a + ' объектов и '+ (b*4)+' атрибутов';
            }
	
				if (Array.isArray(a)) {
						if (Array.isArray(b)) {
						  return 'Общая площадь артефактов сжатия: ' + square(a, b) + ' пикселей';
						};
						
						return 'Количество красных точек во всех строчках изображения: ' + sum(a);
						} 
	return '';
              
  };



