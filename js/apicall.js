

// ==================================
// SETTINGS
var APIADDR    = "/api/api.php/";
var LOCALE     = "fi";
// ==================================


var labelarr       = [];
var current_table  = "";

function showChart(bool) {
  if (bool) {
    $("#myChart").show();
    $("#chartTitle").show();
    $("#tableTitle").hide();
    $("#dataTable").hide();

  } else {
    $("#myChart").hide();
    $("#chartTitle").hide();
    $("#tableTitle").show();
    $("#dataTable").show();
  }
}

function setCurrent() {

    $("#tableMenu").find("span.sr-only").remove();

    $("#tableMenu a.nav-link").each(function() {
        if (window.location.hash == $(this).attr('href')) {
            $(this).addClass("active");
        } else {
            $(this).removeClass("active");
        }
    });
}

function setFormInput() {

    var keyarr = ["device", "payload"];
    //$( "#newModalForm" ).empty();
    $("#newModalForm").find(".dynamic").remove();
    $("#newButton").hide();

    switch(current_table) {
        case "schedule":
            $("#startForm").show();
            break;
        case "command":
            $("#startForm").hide();
            break;
        default:
            return;
    }

    $("#modalTitle").text('New ' + current_table);
    $("#newButton").show();

    for (var key in keyarr) {
        if (keyarr[key] != "id" && keyarr[key] != "time") {
            str = '<div class="form-group dynamic">';
            str += '<label for="'+keyarr[key]+'-name" class="col-form-label">'+keyarr[key]+'</label>';
            str += '<input type="text" class="form-control" id="'+keyarr[key]+'-name">';
            str += '</div>';
            $( "#newModalForm" ).append(str);
        }
    }
}

function setThead(d) {
  $( "#dataTable > thead > tr" ).empty();
  if (d != null) {
    var keyarr = [];
    var keys = Object.keys(d);
    for(var i = 0; i < keys.length; i++) {
        $( "#dataTable > thead > tr" ).append("<th>"+keys[i]+"</th>");
        keyarr.push(keys[i]);
    }
    $( "#dataTable > thead > tr" ).append("<th>Delete</th>");
  }
}

function setTbody(data, table) {
  $( "#dataTable > tbody" ).empty();
  for (var d in data) {

    var str = "<tr>";

    for (var k in data[d]) {
        if (k == "start") {
            var mom = moment.unix(data[d][k]);
            mom.locale(LOCALE);
            str += "<td>"+mom.format('lll')+"</td>";
        } else {
            str += "<td>"+data[d][k]+"</td>";
        }
    }

    str += "<td><a class=\"apicall\" href=\"";
    str += "#delete.table."+table+"."+data[d].id;
    str += "\">del</a></td>";

    str += "</tr>";
    $( "#dataTable > tbody" ).append(str);
  }
}

function callApi(href, body) {
  href = href.replace("#", "");
  var hrefparts = href.split(".");

  if (hrefparts.length < 2) {
      return;
  }
  console.log("----callApi");
  console.log("href: " + hrefparts);
  console.log("body: " + body);

  var urladd = hrefparts[2];
  current_table =  urladd;
  if (hrefparts[1] == "table" && hrefparts[3] != null) {
    urladd += "/" +  hrefparts[3];
  }

  $.ajax({
    type: hrefparts[0],
    dataType: "json",
    data: body,
    url: APIADDR+urladd,
    success: function(data){
        console.log(data);
        setFormInput();

        if (hrefparts[0] == "get") {
            if (hrefparts[1] == "chart") {
                $("#mainTitle").text(hrefparts[1] +" "+current_table);
                setChart(data, hrefparts[3], hrefparts[4], hrefparts[5]);
            } else if (hrefparts[1] == "table") {
                $("#mainTitle").text(hrefparts[1]+" "+current_table);
                setThead(data[0]);
                setTbody(data, hrefparts[2]);
            }
            setCurrent();
        } else {
            window.location.hash = "#get.table."+current_table;
            location.reload();
        }


        }
  });
}

function setChart(data, device, key, amount) {
  var fmidata = [];
  for (var s in data) {
    if (data[s].device == device) {
      fmidata.push(data[s]);
    }
  }

  try {
    amount = parseInt(amount) * -1;
    var sdata = fmidata.slice(amount,fmidata.length);
  } catch(err) {
    var sdata = fmidata;
  }

  var ls = [];
  var ds = [];

  for (var s in sdata) {
    ds.push(JSON.parse(sdata[s].payload).status[key]);
    ls.push(sdata[s].time);
  }

  drawChart(ls, ds);
};

function drawChart(ls, ds) {

  showChart(true);

  var ctx = document.getElementById("myChart");
  var myChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: ls,
      datasets: [{
        data: ds,
        lineTension: 0,
        backgroundColor: 'transparent',
        borderColor: '#007bff',
        borderWidth: 4,
        pointBackgroundColor: '#007bff'
      }]
    },
    options: {
      scales: {
        yAxes: [{
          ticks: {
            beginAtZero: false
          }
        }]
      },
      legend: {
        display: false,
      }
    }
  });
};

$(document).ready(function(){

  showChart(false);
  callApi(window.location.hash, "");


  $('#datetimepicker1').datetimepicker({
            locale: LOCALE
        });

  $(document).on('click', '.apicall', function(){
    showChart(false);
    var href = $(this).attr("href");
    callApi(href, "");
  });

  setCurrent();

  $(document).on('click', '#newSaveButton', function(){
    var href = "post.table."+current_table;

    var data = {};
    $(".form-group").each(function() {
        data[$(this).children("label").text()] = $(this).children("input").val();
    });

    if (current_table == 'schedule') {
        var momentDate = $('#datetimepicker1').data('datetimepicker').viewDate();
        data['start'] = momentDate.unix()
    }
    callApi(href, JSON.stringify(data));
  });

});
