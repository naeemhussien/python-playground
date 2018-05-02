var mlApp = angular.module('mlApp', []);
mlApp.controller('mlController', ['$scope', function($scope) {

  var container = document.getElementById('draw');
  $scope.digits = [0,1,2,3,4,5,6,7,8,9]
  $scope.draw = init(container, 200, 200, '#ffffff');
  $scope.showTrainingData = false;

  $scope.getTrainingData = function() {
    if($scope.data) return
    var getDigitDataset = new Promise(function(resolve, reject) {
      callPythonAnywhere('getDigitDataset',null,resolve,reject)
    }).then((response)=>{
      $scope.data = response.data
      $scope.dataURL = $scope.data.map(a=>pixelArrayToDataURL(a))
      $scope.target = response.target
      $scope.$apply()
    },(reject)=>alert(reject))
  }
  

  $scope.predictDigit = () => {
    //getDigitDataset.then(()=>
    new Promise(function(resolve, reject) {
      var array = getArrayFromCanvas($scope.draw.canvas,$scope.draw.context,resolve)
    }).then((array)=>
      new Promise(function(resolve, reject) {
        var trained = { input : [array] }
        callPythonAnywhere('predictDigit',trained,resolve)
      })
    ).then((predict)=>{
      $scope.predict = predict
      $scope.predict.dataURL = predict.input.map(pixelArrayToDataURL)
      if($scope.predict.confusionMatrix) {
        totalData = 0
        totalCorrect = 0
        $scope.predict.confusionMatrix.map((e,i)=>{
          e.map((f,j)=>{
            totalData +=f
            if(i == j) { totalCorrect+=f }
          })
        })
        $scope.predict.accuracy = totalCorrect / totalData * 100
      } else {
        $scope.predict.accuracy = 0.0
      }
      
      $scope.$apply()
    },(reject)=>alert(reject))
  }
}])

var standardCanvas = document.createElement("canvas");
standardCanvas.width = 8
standardCanvas.height = 8

var standardContext = standardCanvas.getContext("2d")
enableSmoothing(standardContext,true)
function pixelArrayToDataURL(array) {
  var palette = standardContext.getImageData(0,0,standardCanvas.width,standardCanvas.height);
  var img = array.map(a=>255-(a*16)).map(a=>[a,a,a,255]).reduce((a,b)=>a.concat(b),[])
  palette.data.set(new Uint8ClampedArray(img));
  standardContext.putImageData(palette,0,0);
  return standardCanvas.toDataURL('image/png',1.0)
}
//
function enableSmoothing(context,val) {
  context.imageSmoothingEnabled = val
  context.mozImageSmoothingEnabled = val
  context.webkitImageSmoothingEnabled = val
  context.msImageSmoothingEnabled = val
}
function getArrayFromCanvas(canvas,context,resolve) {
  var destCanvas = document.createElement('canvas')
  destCanvas.width = standardCanvas.width
  destCanvas.height = standardCanvas.height
  var destContext = destCanvas.getContext('2d')
  enableSmoothing(destContext,true)
  
  //enableSmoothing(context,true)
  //destContext.scale(destCanvas.width/canvas.width,destCanvas.height/canvas.height)
  
  destContext.drawImage(canvas, 0, 0,destCanvas.width,destCanvas.height)
  var imageData = destContext.getImageData(0,0,destCanvas.width,destCanvas.height)
  var imageArray = imageData.data.reduce((a,b,i)=>{if(i%4==0){a.push(Math.round((255-b)/16))}return a},[])
  resolve(imageArray)
  /*
  var img = new Image()
  img.src = canvas.toDataURL()
  img.width = destCanvas.width
  img.height = destCanvas.height
  img.onload = function() {
    destContext.drawImage(this, 0, 0,destCanvas.width,destCanvas.height)
    var imageData = destContext.getImageData(0,0,destCanvas.width,destCanvas.height)
    var imageArray = imageData.data.reduce(
      (a,b,i)=>{if(i%4==0){a.push(Math.round((255-b)/16))}return a},[]
    )
    resolve(imageArray)
  }
  */
}
function transpose(a) {
    return Object.keys(a[0]).map(function(c) {
        return a.map(function(r) { return r[c]; });
    });
}

//
function createCanvas(parent, width, height) {
  var canvas = {};
  canvas.node = document.createElement('canvas');
  canvas.context = canvas.node.getContext('2d');
  canvas.node.width = width || 100;
  canvas.node.height = height || 100;
  parent.appendChild(canvas.node);
  return canvas;
}

function init(container, width, height, fillColor,lineColor) {
  var canvas = createCanvas(container, width, height);
  var ctx = canvas.context;
  // define a custom fillCircle method
  var clr = hexToRgb(lineColor||'#000000')
  ctx.fillCircle = function(x, y, radius, fillColor) {
    //this.fillStyle = fillColor;
    var gradient = this.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0.0, 'rgba('+clr.r+','+clr.g+','+clr.b+',0.5)');
    gradient.addColorStop(0.3, 'rgba('+clr.r+','+clr.g+','+clr.b+',0.2)');
    gradient.addColorStop(1.0, 'rgba('+clr.r+','+clr.g+','+clr.b+',0.0)');
    this.fillStyle = gradient;
    this.beginPath();
    this.moveTo(x, y);
    this.arc(x, y, radius, 0, Math.PI * 2, false);
    this.fill();
  };
  ctx.clearTo = function(fillColor) {
    ctx.fillStyle = fillColor;
    ctx.fillRect(0, 0, width, height);
  };
  ctx.clearTo(fillColor || "#ffffff");

  // bind mouse events
  var mouseMove = function(e) {
    if (!canvas.isDrawing) {
      return;
    }
   
    var coord = {
      x : e.pageX - canvas.node.offsetLeft,
      y : e.pageY - canvas.node.offsetTop
    }
    var radius = 28; // or whatever
    var fillColor = '#000000';
    if(!canvas.prevMove || distance( coord,canvas.prevMove ) > 3) {
      ctx.fillCircle(coord.x, coord.y, radius, fillColor);
      canvas.prevMove = coord
    }
    
  };
  
  var startDraw = function(e) { canvas.isDrawing = true; }
  var stopDraw = function(e) { canvas.isDrawing = canvas.prevMove = false; }
  
  canvas.node.ontouchmove = function (e) {
    var touch = e.touches[0];
    clientX = touch.clientX + document.scrollingElement.scrollLeft//touch.clientX,
    clientY = touch.clientY + document.scrollingElement.scrollTop //touch.clientY
    var mouseEvent = new MouseEvent("mousemove", {
      clientX: clientX, //touch.clientX,
      clientY: clientY  //touch.clientY
    });
    canvas.node.dispatchEvent(mouseEvent);
  }
  canvas.node.onmousemove = mouseMove
  canvas.node.onmousedown = startDraw
  canvas.node.onmouseup = stopDraw
  canvas.node.ontouchstart = startDraw
  canvas.node.ontouchend = stopDraw
  
  //Stop the page from scrolling when touching the canvas
  var preventScroll = function (e) {
    if (e.target == canvas.node) { e.preventDefault(); }
  }
  document.body.addEventListener("touchstart", preventScroll, {passive: false});
  document.body.addEventListener("touchend", preventScroll, {passive: false});
  document.body.addEventListener("touchmove", preventScroll, {passive: false});
  
  return { context : ctx, canvas : canvas.node };
}
function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}
function distance(a,b) {
  return Math.sqrt( Math.pow(a.x-b.x,2) + Math.pow(a.y-b.y,2) )
}