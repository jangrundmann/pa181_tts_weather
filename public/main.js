// Copyright IBM Corp. 2016  All Rights Reserved.
// Weather Company Data for IBM Bluemix Demo App

//-- display json in tables

var cellColors = [ "689fd5", "87b2dd", "a3c4e5", "c7ddf3", "e1edfb" ];

function getCellColor(depth) {
	return cellColors[Math.min(depth, cellColors.length - 1)];
}

function renderArray(arr, depth) {
	depth = depth || 0;
	var s = "";
	if (arr.length) {
		s += '<div class="cde_array">'

		for (var i = 0; i < arr.length; i++) {
			s += '<div class="cde_item">';
			if (typeof arr[i] == "object") {
				if (arr[i] instanceof Array) {
					s += renderArray(arr[i], depth + 1);
				} else {
					s += renderObject(arr[i], depth + 1);
				}
			} else {
				s += '<span style="padding:3px;">' + arr[i] + '</span>';
			}
			s += '</div>';
		}
		s += '</div>';
	}
	return s;
}

function renderObject(obj, depth) {
	depth = depth || 0; 
	var s = "";
	s += '<div class="cde_object">'
	+		'<table cellpadding="0" cellspacing="0px" width="100%">';

	for (var n in obj) {
		s +=	'<tr>'
		+	 		'<td  align="left" valign="top" class="cde_cell_property"'
		+					' bgcolor="#' + getCellColor(depth) + '" style="border:1px solid #cccccc;">' 
		+ 				'<span style="padding:5px; color:' + (depth == 0 ? '#FFFFFF' : '#000000') + '" style="border:1px solid silver;">'
		+					n
		+				'</span>'
		+ 			'</td>'
		+			'<td align="left" valign="top" width="100%" class="cde_cell_value" bgcolor="#' + getCellColor(depth) + '"' 
		+				(typeof obj[n] != "object" ? ' style="border:1px solid #cccccc;"' : '') + '>';

		if (n == "image") {
			s += '<img src="' + obj[n] + '"/>'
		} else if (typeof obj[n] == "object") {
			if (obj[n] instanceof Array) {
				s += renderArray(obj[n], depth + 1);
			} else {
				s += renderObject(obj[n], depth + 1);
			}
		} else {
			s += '<span style="padding:5px;">' + obj[n] + '</span>';
		}

		s += 		'</td>'
		+		'</tr>';
	}
	s +=	'</table>'
	+	'</div>';
	return s;
}

//-- daily display

function getIconURL(code) {
	return "images/weathericons/icon" + code + ".png";
}

function getDow(d) {
    var weekNames = [ "Sunday", "Monday", "Tuesday", "Wednedsay", "Thursday", "Friday", "Saturday" ];
    return weekNames[d.getDay()]; 
}

function getMonthDate(d) {
   	var monthNames = [ "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" ];
    return monthNames[d.getMonth()] + ' ' + d.getDate();
}

function parseDate(d) {
    var weekNames = [ "Sunday", "Monday", "Tuesday", "Wednedsay", "Thursday", "Friday", "Saturday" ],
    	monthNames = [ "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" ],
        d2 = weekNames[d.getDay()] + ', ' 
        + 	monthNames[d.getMonth()] + ' ' 
        +  	d.getDate() + ', ' 
        +	d.getFullYear() + ' @ ' 
        +	d.getHours() + ':' 
        + 	pad(d.getMinutes(), 2)
    return d2;
}

function getTime(iso) {
	if (iso) {
		return iso.substring(11, 16);
	} else {
		return "unknown";
	}
}

function speedType() {
	return "KPH";
}

function tempType() {
	return "C";
}
var speechString = "";
function updateToday(forecast) {
	var d = new Date(forecast.fcst_valid_local);
	if (d.toString() == "Invalid Date") {
		d = new Date();
	}
	var dateString =  getMonthDate(d) + ", " + d.getFullYear();
	var data = forecast.day || forecast.night;

	$("#weather_icon").html('<img id="weather_icon" hspace="10px" width="70px" height="70px" src="' + getIconURL(data.icon_code) + '"/>');
	$("#weather_dow").html(forecast.dow);
	$("#weather_date").html(dateString);
	$("#weather_desc").html(data.phrase_32char);
	$("#weather_wind").html(data.wdir_cardinal + ' ' + data.wspd + ' ' + speedType());
	$("#weather_humidity").html(data.rh + '%');
	$("#weather_uv").html(data.uv_index + ' out of 10');
	$("#weather_sunrise").html(getTime(forecast.sunrise));
	$("#weather_sunset").html(getTime(forecast.sunset));
	$("#weather_moonrise").html(getTime(forecast.moonrise));
	$("#weather_moonset").html(getTime(forecast.moonset));

	$("#weather_display").css('display', 'block');
		
	speechString += 'Today is '+ forecast.dow+ ' the '+dateString+ '. The temperature is '+hourlyForecasts[0].temp+ ' °Celsius, expect '+data.phrase_32char+ '. Humidity is at ' +data.rh+ 'percent';
	var audio = new Audio('https://pa181-weather-speech.mybluemix.net/talk/sayit?text_to_say='+speechString);
	audio.play();
	console.log(speechString);
}

function resetToday() {
	$("#weather_display").css('display', 'none');
}

var dailyForecasts = [];	// current data

function displayDaily(result) {
	if (result.forecasts) {
		dailyForecasts = result.forecasts.slice(1);
		updateToday(result.forecasts[0]);
		}
}

// daily events

var dailyVisible = [];	// undefined == create, true == visible, false == hidden

function dailyReset() {
	dailyForecasts = [];
	dailyVisible = [];
	$("#weather_daily").html("");
	$("#weather_hourly_json").html("");
	$("#daily_throbber").css('display', 'block');
}

//-- hourly display

var hourlyForecasts = [];	// current data

var dayColors = [
	"#81AEF1",	// noon
	"#164F9C",	// day
	"#02356A",	// twilight
	"black"		// night
];

// 0: noon, 1: day, 2: twilight, 3: night
function hourState(hour, sunrise, sunset) {
	//if (hour == 12) return 0;
	if (hour == sunrise) return 2;
	if (hour == sunset) return 2;
	if (hour > sunrise && hour < sunset) return 1;
	return 3;
}

function hourColor(hour, sunrise, sunset) {
	return dayColors[hourState(hour, sunrise, sunset)];
}

function renderHour(forecast, index) {
	var hour = forecast.fcst_valid_local.substring(11, 13);
	var sunrise = 5;
	var sunset = 20;
	var color = hourColor(hour, sunrise, sunset);
	var s = 
		'<table id="hourCell_' + index + '" cellspacing="0px" width="28px" height="80px" style="border:1px solid transparent; margin:0 auto; background-color:' + color + '; color:white; user-select:none; -moz-user-select:-moz-none; cursor:pointer"'
	+		' onmouseover="overHour(this);" onmouseout="outHour(this);"; onclick="clickHour(' + index + ');">'
	+		'<tr>'
	+		 	'<td valign="top" align="center">'
	+				'<span style="font-size:11pt;">' + hour + '</span>'
	+			'</td>'
	+		'</tr>'
	+		'<tr>'
	+			'<td valign="top" align="left" height="30px" width="30px">'
	+ 				'<img vspace="3px" hspace="3px" width="22px" height="22px" src="' + getIconURL(forecast.icon_code) + '"/>'
	+			'</td>'
	+	 	'</tr>'
	+		'<tr>'
	+			'<td valign="top" align="center">'
	+				'<span style="font-size:8pt;">' + forecast.temp + '&#176;</span>'
	+			'</td>'
	+	 	'</tr>'

	+	'</table>';
	return s;
}

function renderHourly(result) {
	var s = 
		'<table cellspacing="0px" style="margin:0 auto;">';
	+		'<tr>';
	result.forecasts.forEach(function(forecast, index) {
		s += 	'<td valign="top" align="center" width="30px">'
		+			renderHour(forecast, index)
		+		'</td>';
	});
	s += 	'</tr>'
	+	'</table>';
	return s;
}

function displayHourly(result) {
	hourlyForecasts = result.forecasts;
	$("#weather_hourly").html(renderHourly(result));
	$("#weather_temp").html(result.forecasts[0].temp + '&#176;' + tempType());
}

// hourly events

var hourIndex = -1;	// currently displayed hour json
var hourDivs = [];	// json table div elements

function hourlyReset() {
	hourIndex = -1;
	hourDivs = [];
	$("#weather_hourly").html("");
	$("#weather_hourly_json").html("");
}

function renderHourJson(index) {
	var s = 
		'<div id="hourlyforecast_' + index + '" style="width:800px; padding:5px; display:none;">'
	+		renderObject({ hourly_forecast: hourlyForecasts[index] })
	+	'</div>';
	return s;
}

function showHourJson(index) {
	if (!hourDivs[index]) {
		document.getElementById("weather_hourly_json").insertAdjacentHTML('beforeend', renderHourJson(index));
		hourDivs[index] = document.getElementById("hourlyforecast_" + index);
	}
	$(hourDivs[index]).show("slow");
	document.getElementById("hourCell_" + index).style.border = "1px solid white";
	hourIndex = index;
}

function hideHourJson(index) {
	if (index > -1) {
		$(hourDivs[index]).hide("slow");
		$("#hourCell_" + index).css("border", "1px solid transparent");
		hourIndex = -1;
	}
}

function clickHour(index) {
	if (index != hourIndex) {
		hideHourJson(hourIndex);
		showHourJson(index);
	} else {
		hideHourJson(hourIndex);
	}
}

function overHour(ele) {
	ele.style.opacity = "0.5";
}

function outHour(ele) {
	ele.style.opacity = "1.0";
}


//-- event handlers

var defaultGeo = "50.07,14.43"; // Ottawaw

function addGeocode(label, geocode) {
	var x = document.getElementById("weather_presets");
	var option = document.createElement("option");
	option.text = label;
	option.value = geocode;
	x.add(option, 0);
}

function setCoordinates() {
	// get coordinate
	var latitude = $("#weather_latitude").val();
	var longitude = $("#weather_longitude").val();
	console.log("setCoordinates: %s,%s", latitude, longitude );
}

function getCoordinates() {
	return document.getElementById("weather_presets").value;
}


function updatePresets(geocode) {
	var index = 0;
	var sel = document.getElementById("weather_presets");
	for(var i = 1; i < sel.options.length; i++) {
		if (sel.options[i].value == geocode) {
			index = i;
			break;
		}
	}
	sel.selectedIndex = index;
}

function updateControls(geocode) {
	if (geocode) {
		var a = geocode.split(",");
		$("#weather_latitude").val(a[0]);
		$("#weather_longitude").val(a[1]);
		document.getElementById("weather_presets").value = geocode;
	}
}


//-- global

function displayReset() {
	resetToday();
	hourlyReset();
	dailyReset();
}



//-- browser geolocation

// callback - done(err, latitude, longitude)
function getLocation(done) {
    var x = document.getElementById("mapholder");
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
       	    var latitude = position.coords.latitude;
       	    var longitude = position.coords.longitude;
       	    done(null, latitude.toFixed(2) + ',' + longitude.toFixed(2));
        }, function(err) {
		    switch(err.code) {
		        case err.PERMISSION_DENIED:
		            done("User denied the request for Geolocation.");
		            break;
		        case err.POSITION_UNAVAILABLE:
		            done("Location information is unavailable.");
		            break;
		        case err.TIMEOUT:
		            done("The request to get user location timed out.");
		            break;
		        case err.UNKNOWN_ERROR:
		            done("An unknown error occurred.");
		            break;
		    }
        });
    } else {
        done("Geolocation is not supported by this browser.");
    }
}

// callback - done(err, result)
function weatherAPI(path, qs, done) {
   	$.ajax({
		url: path,
		type: 'GET',
		contentType:'application/json',
		data: qs,
  		success: function(data) {
  			if (data.message == 401) {
  				try {
  					data.data = JSON.parse(data.data);
  				} catch(e) {
  				}
				done(data);
  			} else {
  				done(null, data);
  			}
		},
		error: function(xhr, textStatus, thrownError) {
			done(textStatus);
		}
	});
}

function renderError(err) {
	console.log(err)
	var s = "";
	if (err.message 
		&& err.data.errors
		&& err.data.errors[0]
		&& err.data.errors[0].error) {
		s += err.message 
		+ 	" - " + err.data.errors[0].error.code 
		+ 	": " + err.data.errors[0].error.message;
	} else {
		s += "Error: " + err;
	}
	console.log(s);
	return s;
}

function showWaiting(throbberdiv, errordiv, displaydiv) {
	$(throbberdiv).css('display', 'block');
	$(displaydiv).css('display', 'none');
	$(errordiv).css('display', 'none');
}

function showError(throbberdiv, errordiv, displaydiv, err) {
	$(throbberdiv).css('display', 'none');
	$(displaydiv).css('display', 'none');
	$(errordiv).css('display', 'block');
	$(errordiv).html('<span style=" vertical-align: middle;">' + renderError(err) + '</span>');
}

function showDisplay(throbberdiv, errordiv, displaydiv) {
	$(throbberdiv).css('display', 'none');
	$(errordiv).css('display', 'none');
	$(displaydiv).css('display', 'block');
}

function setLocation(geocode, units, language) {
	geocode = geocode || getCoordinates();
	units = units;
	language = language;

	displayReset();
	updateControls(geocode);

	showWaiting('#hourly_throbber', '#hourly_error', '#weather_hourly');
	weatherAPI("/api/forecast/hourly", { 
		geocode: geocode,
		units: units,
		language: language
	}, function(err, data) {
  		if (err) {
  			showError('#hourly_throbber', '#hourly_error', '#weather_hourly', err);
  		} else {
  			if (data.forecasts) {
  				showDisplay('#hourly_throbber', '#hourly_error', '#weather_hourly');
				displayHourly(data);
			} else {
	  			showError('#hourly_throbber', '#hourly_error', '#weather_hourly', "Data missing");
			}
  		}
	});

	showWaiting('#daily_throbber', '#daily_error', '#daily_display');
	weatherAPI("/api/forecast/daily", { 
		geocode: geocode,
		units: units,
		language: language
	}, function(err, data) {
  		if (err) {
  			showError('#daily_throbber', '#daily_error', '#daily_display', err);
  		} else {
  			if (data.forecasts) {
	  			showDisplay('#daily_throbber', '#daily_error', '#daily_display');
				displayDaily(data);
			} else {
	  			showError('#daily_throbber', '#daily_error', '#daily_display', "Data missing");
	  		}
  		}
	});

	
}

function init() {
	getLocation(function(err, geocode) {
		if (err) {
			setLocation();
		} else {
			addGeocode('Local', geocode);
			setLocation(geocode, "m", "en");
		}
	});
	
}

