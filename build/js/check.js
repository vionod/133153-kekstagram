
function square(a,b) {
		var result= 0;
		for (var i=0; (i<a.length)&&(i<b.length); i++) {
				result=result+(a[i]*b[i]);
		};
		return(result);
};

function sum(a) {
		var result=0;
		for(var i=0; (i<a.length); i++) {
				result=result+a[i];
		};
		return(result);
};

function getMessage(a, b) {
		var outString='';
  if (typeof(a)=='boolean') {
			  if (a) {
            outString=('Переданное изображение анимированно и содержит '+ b + ' кадров');
						return(outString);
            }
        else {
            outString=('Переданное GIF-изображение не анимированно');
						return(outString);
            }
    }
	else
				if (typeof(a)=='number') {
            outString=('Переданное SVG-изображение содержит ' + a + ' объектов и '+ (b*4)+' атрибутов');
						return(outString);
            }
        else 
						if ((a.length>1)&&(b.length>1)) {
								outString=('Общая площадь артефактов сжатия: ' + square(a, b) +' пикселей');
								return(outString);
             }
		//Не могу понять почему зависает при анализе  png?? 
						else  if (a.length>1) {
								outString=('Количество красных точек во всех строчках изображения: '+ sum(a));
								return(outString);
						} 
              
  };



