
function getRandom(data) {
  return data.splice(data.length * Math.random() | 0, 1)[0]
}

//Do some cleanup
MR2Data = MR2Data.map(function(data){
  data.DEFFERAL_CATEGORY = data.DEFFERAL_CATEGORY === "NIL" ? "" : data.DEFFERAL_CATEGORY;
  data.DEFRERAL_TYPE = data.DEFRERAL_TYPE === "NIL" ? "" : data.DEFRERAL_TYPE;
  return data
})
var aircraftList = MR2Data.reduce(function(o,m){
  o[m.ACREGN] = o[m.ACREGN] || {
    ACREGN : m.ACREGN,
    DEFECTS : [],
    AIRPORT : getRandom(airports),
    COLOR : '',
    
    //the following will be calculated
    category : {
      A : 0, B : 0, C : 0, D : 0
    },
    categoryMax : 0,
    categoryMin : 0,
    
    mel : 0,
    nonmel : 0,
    melMax  : 0,
    
    varToHealthy : '-'
  }
  var obj = o[m.ACREGN]
  
  obj.heading = Math.floor(Math.random() * 360)
  obj.coordinates = obj.AIRPORT.longitude_deg + "," + obj.AIRPORT.latitude_deg
  obj.DEFECTS.push({DISC_DESC: m.DISC_DESC, DEFRERAL_TYPE: m.DEFRERAL_TYPE, DEFFERAL_CATEGORY : m.DEFFERAL_CATEGORY})
  
  if (m.DEFFERAL_CATEGORY) { 
    obj.category[m.DEFFERAL_CATEGORY]++ 
    obj.categoryMax = Math.max(obj.category.A,obj.category.B,obj.category.C,obj.category.D)    
    obj.categoryMin = Math.min(obj.category.A,obj.category.B,obj.category.C,obj.category.D)
  }
  
  if (m.DEFRERAL_TYPE) {
    obj.mel++;
  } else {
    obj.nonmel++
  }
  obj.melMax = Math.max(obj.mel,obj.nonmel)
  
  if(obj.DEFECTS.length <= 6) {
    obj.COLOR = 'g'
  } else if (obj.DEFECTS.length <= 10) {
    obj.COLOR = 'y'
  } else {
    obj.COLOR = 'r'
  }
  if(obj.DEFECTS.length-10<=0) {
    obj.varToHealthy = "-"
  } else {
    obj.varToHealthy = "" + (obj.DEFECTS.length-10)
  }
  
  return o
},{})

aircraftList = Object.keys(aircraftList).map(function(key){return aircraftList[key];})
var map = L.map('mapid').setView([4,109.2], 6);

//var tileLayerURL = 'http://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png' //Humanitarian
var tileLayerURL = 'http://{s}.tile.osm.org/{z}/{x}/{y}.png' //Standard
L.tileLayer(tileLayerURL, {
   attribution:
      '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

function getPopupHTML(data) {
  var categoryBarchart = data.categoryMax < 1 ? "" : "<img src=\"http://chart.googleapis.com/chart?" +
    "cht=bvg&" + 
    "chs=200x100&" + 
    "chd=t:"+Object.keys(data.category).map(function(key){return (data.category[key]/data.categoryMax)*100;}).join(",")+"&" +
    "chxl=1:|" + Object.keys(data.category).join("|")+ "|0:|0||"+Math.round((data.categoryMax/2)*10)/10+"||"+Math.round(data.categoryMax)+"&" +
    "chxt=y,x&" +
    "chco=FFC6A5|FFFF42|DEF3BD|00A5C6" +
    //"chxs=0,ff0000,12,0,lt|1,0000ff,10,1,lt" + 
    "\"/><br/>";
    
  var melBarchart = data.melMax < 1? "" : "<img src=\"http://chart.googleapis.com/chart?" +
    "cht=bvg&" + 
    "chs=200x100&" + 
    "chd=t:"+[data.mel,data.nonmel].map(function(d){return (d/data.melMax)*100;}).join(",")+"&" +
    "chxl=1:|MEL|Non-MEL|0:|0||"+Math.round((data.melMax/2)*10)/10+"||"+Math.round(data.melMax)+"&" +
    "chxt=y,x&" +
    "chco=ee4444|44ee44&" +
    "chbh=35,4,30" +
    //"chxs=0,ff0000,12,0,lt|1,0000ff,10,1,lt" + 
    "\"/><br/>"
  var html =  
    "<b>"+data.ACREGN+"</b><br/>" + categoryBarchart + "" + melBarchart +
    "<b>Location</b>&nbsp;" + data.AIRPORT.ident + "-" + data.AIRPORT.name
  
  return html;
}

function printKML() {
  var kml = '<kml></kml>'
  console.log(kml)
}

$(".panel-left").resizable({
  handleSelector: ".splitter",
  resizeHeight: false,
  
});



var mlApp = angular.module('mlApp', []);
mlApp.controller('mlController', ['$scope', function($scope) {
  $scope.resizeMap = function(){ map.invalidateSize();}
  $scope.mr2table = MR2Data;
  $scope.mr2summary = aircraftList
  
  aircraftList.map(function(data){
    var coordinates = data.coordinates.split(",")
    var size = 40
    var icon = L.icon({
      className: 'shadowed',
      iconUrl: aircraftPng[data.COLOR],
      iconSize: [size, size],
      iconAnchor: [size/2, size/2],
      popupAnchor: [0, -size/4],
      //shadowUrl: 'my-icon-shadow.png',
      //shadowSize: [68, 95],
      //shadowAnchor: [22, 94]
  });
    var marker = L.marker(coordinates.reverse(),{
      icon : icon,
      rotationAngle: data.heading,
      title : data.name
    }).addTo(map);
    
    var popupHTML = getPopupHTML(data)
    var popup = marker.bindPopup(popupHTML,{
      minWidth : 300
    })
    popup.aircraft = data
    popup.on('popupopen', function(e) {
      $scope.mr2table = $scope.mr2table.filter(function(d){ return d.ACREGN == e.sourceTarget.aircraft.ACREGN })
      $scope.mr2summary = $scope.mr2summary.filter(function(d){ return d.ACREGN == e.sourceTarget.aircraft.ACREGN })
      $scope.$apply()
    });
    
    popup.on('popupclose', function(e) {
      $scope.mr2table = MR2Data;
      $scope.mr2summary = aircraftList;
      $scope.$apply()
    });
  })

  $scope.changeFormMode = function() {
    $scope.formMode = !$scope.formMode
    document.getElementById("form-overlay").style.display = $scope.formMode ? "block" : "none";
  }
  $scope.formMode = false;
  $scope.changeFormMode()
  
  map.invalidateSize();
  
  /* Machine Learning Section */
  $scope.classifier = new BayesClassifier();
    
  ['Yes','No'].map(function(cabin){
    var documents = MR2Data.filter(function(data){return cabin === "Yes" ? data.CABIN === "CABIN" : data.CABIN === "";}).map(function(d){return d.DISC_DESC})
    $scope.classifier.addDocuments(documents, cabin)
  })
  
  $scope.classifier.train()
  $scope.performBayes = function(input) {
    $scope.formCabin = $scope.classifier.classify(input)
  }
  $scope.isCurrentCabin = function(val) {
    return $scope.formCabin === val;
  }
  $scope.isCurrentCategory = function(val) {
    return $scope.formCategory === val;
  }
  
}])