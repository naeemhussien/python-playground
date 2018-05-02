function callPythonAnywhere(service,parameters,response,reject) {
  var parameterList = parameters ? Object.keys(parameters).map((k)=>{
    return `${k}=${JSON.stringify(parameters[k])}`
  }).join('&') : ""
  var xhttp = new XMLHttpRequest();
  var url = `https://shahrin14.pythonanywhere.com/${service}?${parameterList}`
  var success = false
  xhttp.open("GET", url, true);
  xhttp.setRequestHeader("Content-type", "application/json");
  xhttp.send();
  //var response = JSON.parse(xhttp.responseText);
  xhttp.onreadystatechange = function() {
    if (xhttp.readyState === 4 && (xhttp.status === 200 || xhttp.status === 304)) {
      // Success! Do stuff with data.
      try {
        console.log(`Call to ${url} returned a response.`)
        success = true
        response(JSON.parse(xhttp.responseText))
      } catch (error) {
        reject(error)
      }
    }
  }
  setTimeout(function(){
    if(!success) {
      reject(new Error("Request timed out. Most likely due to CORS."))
    }
  },5000)
}