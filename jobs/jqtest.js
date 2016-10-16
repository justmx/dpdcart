$("#lnkSales").click(function(eventObj) {
  var message = "#lnkSales is clicked.\n";
  eventObj.preventDefault();
  message += "Default event handler is prevented...";
  alert(message);
});


$("#lnkMarketing").click(function(eventObj) {
  var message = "#lnkMarketing is clicked.\n";
  message += "Default event handler is NOT prevented...";
  alert(message);
});


$("#imgSample").mouseenter(function(eventObject) {
  getEventObjectProperties(eventObject);
});


$("input").on("focus", function(eventObject) {
  getEventObjectProperties(eventObject);
});

$("button").on("click", function(eventObject) {
  getEventObjectProperties(eventObject);
});

function getEventObjectProperties(eventObject) {
  // eventObject.target is the DOM element that triggered
  // the element
  // Get properties of the element, which has triggered
  // the event
  var message = "<u>" + eventObject.type + "</u> event is triggered on <u>" +
    eventObject.target.nodeName.toLowerCase() + "</u> with the id: <u>" +
    $(eventObject.target).attr("id") + "</u><br>";
  message += "Key/Button was pressed: <u>" + eventObject.which + "</u><br>";
  message += "(x, y) coordinate of the mouse when event is triggered: (<u>" + eventObject.pageX + "</u>, <u>" + eventObject.pageY + "</u>)";
  $("#message").html(message);
}