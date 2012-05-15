var DOM1;
$(document).ready(function()
{

	// Jquery-ui navigation buttons
    navbuttonsJqueryUi();
    addClassEmpty();
	DOM1 = (typeof document.getElementsByTagName!='undefined');
    if (typeof LEMsetTabIndexes === 'function') { LEMsetTabIndexes(); }
	if (typeof checkconditions!='undefined') checkconditions();
	if (typeof template_onload!='undefined') template_onload();
	prepareCellAdapters();
    if (typeof(focus_element) != 'undefined')
    {
        $(focus_element).focus();
    }
    $(".question").find("select").each(function () {
        hookEvent($(this).attr('id'),'mousewheel',noScroll);
    });

    // Keypad functions
    var kp = $("input.num-keypad");
    if(kp.length)
	{ 
		kp.keypad({
			showAnim: 'fadeIn', keypadOnly: false,
			onKeypress: function(key, value, inst) { 
				$(this).trigger('keyup');
			}
		});
	}
    kp = $(".text-keypad");
    if(kp.length)
    {
        var spacer = $.keypad.HALF_SPACE;
        for(var i = 0; i != 8; ++i) spacer += $.keypad.SPACE;
	    kp.keypad({
		    showAnim: 'fadeIn',
		    keypadOnly: false,
		    layout: [
                spacer + $.keypad.CLEAR + $.keypad.CLOSE, $.keypad.SPACE,
			    '!@#$%^&*()_=' + $.keypad.HALF_SPACE + $.keypad.BACK,
			    $.keypad.HALF_SPACE + '`~[]{}<>\\|/' + $.keypad.SPACE + $.keypad.SPACE + '789',
			    'qwertyuiop\'"' + $.keypad.HALF_SPACE + $.keypad.SPACE + '456',
			    $.keypad.HALF_SPACE + 'asdfghjkl;:' + $.keypad.SPACE + $.keypad.SPACE + '123',
			    $.keypad.SPACE + 'zxcvbnm,.?' + $.keypad.SPACE + $.keypad.SPACE + $.keypad.HALF_SPACE + '-0+',
			    $.keypad.SHIFT + $.keypad.SPACE_BAR + $.keypad.ENTER],
				onKeypress: function(key, value, inst) { 
					$(this).trigger('keyup');
				}
			});
    }

    // Maxlength for textareas TODO limit to not CSS3 compatible browser
    maxlengthtextarea();

    // Maps
	$(".location").each(function(index,element){
		var question = $(element).attr('name');
		var coordinates = $(element).val();
		var latLng = coordinates.split(" ");
		var question_id = question.substr(0,question.length-2);
		if ($("#mapservice_"+question_id).val()==1){
			// Google Maps
			if (gmaps[''+question] == undefined) {
				GMapsInitialize(question,latLng[0],latLng[1]);
			}
		}
		else if ($("#mapservice_"+question_id).val()==2){
			// Open Street Map
			if (osmaps[''+question]==undefined) {
				osmaps[''+question] = OSMapInitialize(question,latLng[0],latLng[1]);
			}
		}
	});
	$(".location").live('focusout',function(event){
		var question = $(event.target).attr('name');
		var name = question.substr(0,question.length - 2);
		var coordinates = $(event.target).attr('value');
		var xy = coordinates.split(" ");
		var currentMap = gmaps[question];
		var marker = gmaps['marker__'+question];
		var markerLatLng = new google.maps.LatLng(xy[0],xy[1]);
		geocodeAddress(name, markerLatLng);
		marker.setPosition(markerLatLng);
		currentMap.panTo(markerLatLng);
	});
	
	// #index
    if ($("#index").size() && $("#index .row.current").size()){
        var idx = $("#index");
        var row = $("#index .row.current");
        idx.scrollTop(row.position().top - idx.height() / 2 - row.height() / 2);
    }
});


// Set jquery-ui to LS Button
function navbuttonsJqueryUi(){
    if ($.browser.msie && $.browser.version.substr(0,1)<8 && $('button.submit').length > 0) { // Get rid of the focus outline in IE7
        $('#movenextbtn, #movesubmitbtn').focus().blur(); 
    }

    $('[dir!="rtl"] #moveprevbtn').button({
    icons: {
        primary: 'ui-icon-triangle-1-w'
    }
    });
    $('[dir="rtl"] #moveprevbtn').button({
    icons: {
        secondary: 'ui-icon-triangle-1-e'
    }
    });
    $('[dir!="rtl"] #movenextbtn').button({
    icons: {
        secondary: 'ui-icon-triangle-1-e'
    }
    });
    $('[dir="rtl"] #movenextbtn').button({
    icons: {
        primary: 'ui-icon-triangle-1-w'
    }
    });
    $('#movesubmitbtn, input.saveall, input.clearall').button();
}

// Put a empty class on empty answer text item (limit to answers part)
function addClassEmpty(){
      $('.answer-item input.text[value=""]').addClass('empty');
      $('.answer-item input[type=text][value=""]').addClass('empty');
      $('.answer-item textarea').each(function(index) {
        if ($(this).val() == ""){
          $(this).addClass('empty');
        }
      });

    $(".answer-item input.text,.text-item input[type=text]").live("blur", function(){ 
      if ($(this).val() == ""){
        $(this).addClass('empty');
      }else{
        $(this).removeClass('empty');
      }
    });
    $(".answer-item textarea").live("blur", function(){ 
      if ($(this).val() == ""){
        $(this).addClass('empty');
      }else{
        $(this).removeClass('empty');
      }
    });
}


gmaps = new Object;
osmaps = new Object;
zoom = [];

// OSMap functions
function OSMapInitialize(question,lat,lng){

    map = new OpenLayers.Map("gmap_canvas_" + question);
    map.addLayer(new OpenLayers.Layer.OSM());
    var lonLat = new OpenLayers.LonLat(lat,lng)
          .transform(
            new OpenLayers.Projection("EPSG:4326"), // transform from WGS 1984
            map.getProjectionObject() // to Spherical Mercator Projection
          );
    var zoom=11;
    var markers = new OpenLayers.Layer.Markers( "Markers" );
    map.addLayer(markers);
    markers.addMarker(new OpenLayers.Marker(lonLat));
    map.setCenter (lonLat, zoom);
    return map;

}

//// Google Maps Functions (for API V3) ////

// Initialize map
function GMapsInitialize(question,lat,lng) {
	
	var name = question.substr(0,question.length - 2);
	var latlng = new google.maps.LatLng(lat, lng);
	
	var mapOptions = {
		zoom: zoom[name],
		center: latlng,
		mapTypeId: google.maps.MapTypeId.ROADMAP
	};
	
	var map = new google.maps.Map(document.getElementById("gmap_canvas_" + question), mapOptions);
	gmaps[''+question] = map;
    
	var marker = new google.maps.Marker({
		position: latlng,
		draggable:true,
		map: map,
		id: 'marker__'+question
	});
	gmaps['marker__'+question] = marker;
	
	google.maps.event.addListener(map, 'rightclick', function(event) {
		marker.setPosition(event.latLng);
		map.panTo(event.latLng);
		geocodeAddress(name, event.latLng);
		$("#answer"+question).val(Math.round(event.latLng.lat()*10000)/10000 + " " + Math.round(event.latLng.lng()*10000)/10000);
	});
	
	google.maps.event.addListener(marker, 'dragend', function(event) {
		//map.panTo(event.latLng);
		geocodeAddress(name, event.latLng);
		$("#answer"+question).val(Math.round(event.latLng.lat()*10000)/10000 + " " + Math.round(event.latLng.lng()*10000)/10000);
	});
}

// Reset map when shown by conditions
function resetMap(qID) {
	var question = $('#question'+qID+' input.location').attr('name');
	var name = question.substr(0,question.length - 2);
	var coordinates = $('#question'+qID+' input.location').attr('value');
	var xy = coordinates.split(" ");
	if(gmaps[question]) {
		var currentMap = gmaps[question];
		var marker = gmaps['marker__'+question];
		var markerLatLng = new google.maps.LatLng(xy[0],xy[1]);
		marker.setPosition(markerLatLng);
		google.maps.event.trigger(currentMap, 'resize')
		currentMap.setCenter(markerLatLng);
	}
}

// Reverse geocoder
function geocodeAddress(name, pos) {
	var geocoder = new google.maps.Geocoder();
	
	var city  = '';
	var state = '';
	var country = '';
	var postal = '';
	
	geocoder.geocode({
		latLng: pos
	}, function(results, status) {
		if (status == google.maps.GeocoderStatus.OK && results[0]) {
			$(results[0].address_components).each(function(i, val) {
				if($.inArray('locality', val.types) > -1) {
					city = val.short_name;
				}
				else if($.inArray('administrative_area_level_1', val.types) > -1) {
					state = val.short_name;
				}
				else if($.inArray('country', val.types) > -1) {
					country = val.short_name;
				}
				else if($.inArray('postal_code', val.types) > -1) {
					postal = val.short_name;
				}
			});
			
			var location = (results[0].geometry.location);
		}
		getInfoToStore(name, pos.lat(), pos.lng(), city, state, country, postal);
	});
}

// Store address info
function getInfoToStore(name, lat, lng, city, state, country, postal){
    
	var boycott = $("#boycott_"+name).val();
    // 2 - city; 3 - state; 4 - country; 5 - postal
    if (boycott.indexOf("2")!=-1)
        city = '';
    if (boycott.indexOf("3")!=-1)
        state = '';
    if (boycott.indexOf("4")!=-1)
        country = '';
    if (boycott.indexOf("5")!=-1)
        postal = '';
    
    $("#answer"+name).val(lat + ';' + lng + ';' + city + ';' + state + ';' + country + ';' + postal);
}

Array.prototype.push = function()
{
	var n = this.length >>> 0;
	for (var i = 0; i < arguments.length; i++)
	{
		this[n] = arguments[i];
		n = n + 1 >>> 0;
	}
	this.length = n;
	return n;
};

Array.prototype.pop = function() {
	var n = this.length >>> 0, value;
	if (n) {
		value = this[--n];
		delete this[n];
	}
	this.length = n;
	return value;
};


//defined in group.php & question.php & survey.php, but a static function
function inArray(needle, haystack)
{
	for (h in haystack)
	{
		if (haystack[h] == needle)
		{
			return true;
		}
	}
	return false;
}

//defined in group.php & survey.php, but a static function
function match_regex(testedstring,str_regexp)
{
	// Regular expression test
	if (str_regexp == '' || testedstring == '') return false;
	pattern = new RegExp(str_regexp);
	return pattern.test(testedstring)
}

function cellAdapter(evt,src)
{
	var eChild = null, eChildren = src.getElementsByTagName('INPUT');
	var curCount = eChildren.length;
	//This cell contains multiple controls, don't know which to set.
	if (eChildren.length > 1)
	{
		//Some cells contain hidden fields
		for (i = 0; i < eChildren.length; i++)
		{
			if ( ( eChildren[i].type == 'radio' || eChildren[i].type == 'checkbox' ) && eChild == null)
				eChild = eChildren[i];
			else if ( ( eChildren[i].type == 'radio' || eChildren[i].type == 'checkbox' ) && eChild != null)
			{
				//A cell with multiple radio buttons -- unhandled
				return;
			}

		}
	}
	else eChild = eChildren[0];

	if (eChild && eChild.type == 'radio')
	{
		eChild.checked = true;
		//Make sure the change propagates to the conditions handling mechanism
		if(eChild.onclick) eChild.onclick(evt);
		if(eChild.onchange) eChild.onchange(evt);
	}
	else if (eChild && eChild.type == 'checkbox')
	{
		eChild.checked = !eChild.checked;
		//Make sure the change propagates to the conditions handling mechanism
		if(eChild.onclick) eChild.onclick(evt);
		if(eChild.onchange) eChild.onchange(evt);
	}
}

function prepareCellAdapters()
	{
	if (!DOM1) return;
	var formCtls = document.getElementsByTagName('INPUT');
	var ptr = null;
	var foundTD = false;
	for (var i = 0; i < formCtls.length; i++)
	{
		ptr = formCtls[i];
		if (ptr.type == 'radio' || ptr.type == 'checkbox')
{
			foundTD = false;
			while (ptr && !foundTD)
	{
				if(ptr.nodeName == 'TD')
		{
					foundTD = true;
					ptr.onclick =
						function(evt){
							return cellAdapter(evt,this);
						};
					continue;
				}
				ptr = ptr.parentNode;
			}
		}
	}
}

function addHiddenField(theform,thename,thevalue)
{
	var myel = document.createElement('input');
	myel.type = 'hidden';
	myel.name = thename;
	theform.appendChild(myel);
	myel.value = thevalue;
}

function cancelBubbleThis(eventObject)
{
	if (!eventObject) var eventObject = window.event;
	eventObject.cancelBubble = true;
	if (eventObject && eventObject.stopPropagation) {
		eventObject.stopPropagation();
	}
}

function cancelEvent(e)
{
  e = e ? e : window.event;
  if(e.stopPropagation)
    e.stopPropagation();
  if(e.preventDefault)
    e.preventDefault();
  e.cancelBubble = true;
  e.cancel = true;
  e.returnValue = false;
  return false;
}

function hookEvent(element, eventName, callback)
{
  if(typeof(element) == "string")
    element = document.getElementById(element);
  if(element == null)
    return;
  if(element.addEventListener)
  {
    if(eventName == 'mousewheel')
      element.addEventListener('DOMMouseScroll', callback, false);
    element.addEventListener(eventName, callback, false);
  }
  else if(element.attachEvent)
    element.attachEvent("on" + eventName, callback);
}

function noScroll(e)
{
  e = e ? e : window.event;
  cancelEvent(e);
}


function getkey(e)
{
   if (window.event) return window.event.keyCode;
    else if (e) return e.which; else return null;
}

function goodchars(e, goods)
{
    var key, keychar;
    key = getkey(e);
    if (key == null) return true;

    // get character
    keychar = String.fromCharCode(key);
    keychar = keychar.toLowerCase();
    goods = goods.toLowerCase();

   // check goodkeys
    if (goods.indexOf(keychar) != -1)
        return true;

    // control keys
    if ( key==null || key==0 || key==8 || key==9  || key==27 )
      return true;

    // else return false
    return false;
}

function show_hide_group(group_id)
{
	var questionCount;

	// First let's show the group description, otherwise, all its childs would have the hidden status
	$("#group-" + group_id).show();
	// If all questions in this group are conditionnal
	// Count visible questions in this group
		questionCount=$("div#group-" + group_id).find("div[id^='question']:visible").size();

		if( questionCount == 0 )
		{
			$("#group-" + group_id).hide();
		}
}

function navigator_countdown_btn()
{
	return $('#movenextbtn, #moveprevbtn, #movesubmitbtn');
}

function navigator_countdown_end()
{
	navigator_countdown_btn().each(function(i, e)
	{
		e.value = $(e).data('text');
		$(e).attr('disabled', '');
	});
	$(window).data('countdown', null);
}

function navigator_countdown_int()
{
	var n = $(window).data('countdown');
	if(n)
	{
		navigator_countdown_btn().each(function(i, e)
		{
			e.value = $(e).data('text');

                        // just count-down for delays longer than 1 second
                        if(n > 1) e.value += " (" + n + ")";
		});

		$(window).data('countdown', --n);
	}
	window.setTimeout((n > 0? navigator_countdown_int: navigator_countdown_end), 1000);
}

function navigator_countdown(n)
{
	$(document).ready(function()
	{
		$(window).data('countdown', n);

		navigator_countdown_btn().each(function(i, e)
		{
			$(e).data('text', e.value);
		});

		navigator_countdown_int();
	});
}

function std_onsubmit_handler()
{
    // disable double-posts in all forms
    $('#moveprevbtn, #movenextbtn, #movesubmitbtn').attr('disabled', 'disabled');
    return true;
}

// round function from phpjs.org
function round (value, precision, mode) {
    // http://kevin.vanzonneveld.net
    var m, f, isHalf, sgn; // helper variables
    precision |= 0; // making sure precision is integer
    m = Math.pow(10, precision);
    value *= m;
    sgn = (value > 0) | -(value < 0); // sign of the number
    isHalf = value % 1 === 0.5 * sgn;
    f = Math.floor(value);

    if (isHalf) {
        switch (mode) {
        case 'PHP_ROUND_HALF_DOWN':
            value = f + (sgn < 0); // rounds .5 toward zero
            break;
        case 'PHP_ROUND_HALF_EVEN':
            value = f + (f % 2 * sgn); // rouds .5 towards the next even integer
            break;
        case 'PHP_ROUND_HALF_ODD':
            value = f + !(f % 2); // rounds .5 towards the next odd integer
            break;
        default:
            value = f + (sgn > 0); // rounds .5 away from zero
        }
    }

    return (isHalf ? value : Math.round(value)) / m;
}

// ==========================================================
// totals

function multi_set(ids,_radix)
{
	//quick ie check
	var ie=(navigator.userAgent.indexOf("MSIE")>=0)?true:false;
	//match for grand
	var _match_grand = new RegExp('grand');
	//match for total
	var _match_total = new RegExp('total');
    var radix = _radix; // comma, period, X (for not using numbers only)
	//main function (obj)
	//id = wrapper id
	function multi_total(id)
	{
		if(!document.getElementById(id)){return;};
		//alert('multi total called value ' + id);
		//generic vars
		//grand total 0 = none, 1 = horo, 2 = vert set if grand found
		var _grand = 0;
		//multi array holder
		var _bits = new Array();

		//var _obj = document.getElementById(id);
		//grab the tr's
		var _obj = document.getElementById(id);//.getElementsByTagName('table');

		//alert(_obj.length);
		var _tr = _obj.getElementsByTagName('tr');
		//counter used in top level of _bits array
		var _counter = 0;
		//generic for vars
		var _i = 0;
		var _l = _tr.length;
		for(_i=0; _i<_l; _i++)
		{
			//check we really have inputs to deal with
			if(_tr[_i].getElementsByTagName('input'))
			{
				var _td = _tr[_i].getElementsByTagName('td');
				//start building some nice arrays
				_bits.push(new Array());
				//clear the vert var set when total found in tr
				var vert =false;
				if(_tr[_i].className && _tr[_i].className.match(_match_total,'ig'))
				{
					//will need to set it up vertical
					vert = true;
				};
				//generic for vars for second level _bits[_i]
				var _a=0;
				var _al = _td.length;
				//alert(_al + ' ' + _i);
				if(_al > 0)
				{
				//	//counter for inner array
					var _tcounter=0;
					for(_a=0; _a < _al; _a++)
					{
						//only bother if we have inputs
						if(_td[_a].getElementsByTagName('input'))
						{
							//grab the first text input
							var _tdin = first_text(_td[_a].getElementsByTagName('input'));
							//check we got a text input
							if(_tdin)
							{
								//add it to the array @ counter
								_bits[_counter].push(_tdin);
								//set key board actions
								_tdin.onkeydown = _in_key;
								_tdin.onchange = calc;
								//check for total and grand total
								if(_td[_a].className && _td[_a].className.match(_match_total,'ig'))
								{
									//clear the key events with false returns
									_tdin.onkeydown = dummy;
									_tdin.onkeyup = dummy;
									//need to check for grand
									if(_td[_a].className.match(_match_grand,'ig'))
									{
										//set up a grand total
										if(vert && _bits[_counter].length > 1)
										{
											_grand=1;
                                            //run calc across last row
                                            calc_horo(_bits.length - 1);
										}
										else
										{
											_grand=2;
											_bits[_counter][_bits[0].length - 1]=_bits[_counter][0];
                                            //run calc on last col
                                            calc_vert(_bits[0].length - 1);
										}
									}
									else
									{
										//set up horo
										horo_set_up(_counter);
									};

								};
								if(vert && _grand == 0)
								{
									//deal with vert calc and clear the keyboard action
									_tdin.onkeydown = dummy;
									_tdin.onkeyup = dummy;
									vert_set_up(_tcounter);

								};
								_tcounter++;
							};
						};

					};
					//check we got some thing that time
					if(_bits[_counter].length == 0)
					{
						_bits.pop();
					}
					else
					{
						_counter++;
					}
				}
				else
				{
					//remove blanks
					_bits.pop();
				}

			};
		};
		//returns the first text input or false
		function first_text(arr)
		{
			var i=0;
			var l=arr.length;
			for(i=0; i<l; i++)
			{
				if(arr[i].getAttribute('type') && arr[i].getAttribute('type') == 'text')
				{
					return(arr[i]);
				}
			}
			return(false);
		}
		//sets up the horizontal calc
		function horo_set_up(id)
		{
			//make all in the row update the final
			//alert('set horo called for row ' + id);

			var i=0;
			var l=_bits[id].length;
			var qt=0;
			for(i=0; i<l; i++)
			{
				var addaclass=!_bits[id][i].getAttribute(ie ? 'className' : 'class') ? '' : _bits[id][i].getAttribute(ie ? 'className' : 'class') + ' ';
				_bits[id][i].setAttribute((ie ? 'className' : 'class'), addaclass + 'horo_' + id);
				_bits[id][i].onChange = calc;
				if(i == (l - 1))
				{
					_bits[id][i].value = round(qt,12)
				}
				else if(_bits[id][i].value)
				{
                    _aval=_bits[id][i].value;
                    if (radix===',') {
                        _aval = _aval.split(',').join('.');
                        _bits[id][i].value = _aval.split('.').join(',');
                    }
                    if  (_aval == parseFloat(_aval)) {
                        qt += +_aval;
                    }
				};
			};

		}
		//sets up the vertical calc
		function vert_set_up(id)
		{
			//alert('set vert called for col ' + id + ' ' + _bits.join('-'));
			id *= 1;
			var i=0;
			var l=_bits.length;
			var qt = 0;
			for(i=0; i<l; i++)
			{
				var addaclass=!_bits[i][id].getAttribute(ie ? 'className' : 'class') ? '' : _bits[i][id].getAttribute(ie ? 'className' : 'class') + ' ';
				_bits[i][id].setAttribute((ie ? 'className' : 'class'), addaclass + 'vert_' + id);
				_bits[i][id].onchange = calc;
				if(i == (l - 1))
				{
					_bits[i][id].value = round(qt,12);
				}
				else if(_bits[i][id].value)
				{
                    _aval=_bits[i][id].value;
                    if (radix===',') {
                        _aval = _aval.split(',').join('.');
                        _bits[i][id].value = _aval.split('.').join(',');
                    }
                    if  (_aval == parseFloat(_aval)) {
                        qt += +_aval;
                    }
				};
			};
		};
		//calculates a row or col or both
		//runs the grand totals if required
		function calc(e)
		{
			//alert('calc called ');
			e=(e)?e:event;
			var el=e.target||e.srcElement;
			var _id=el.getAttribute(ie ? 'className' : 'class');

            // eliminate bad numbers
            _aval=el.value;
            if (radix===',') {
                _aval = _aval.split(',').join('.');
            }
            if (radix!=='X' && _aval != parseFloat(_aval)) {
                el.value = "";
            }

			//vert_[id] horo_[id] in class trigger vert or horo calc on row[id]
			if(_id.match('vert_','ig'))
			{
				var vid = get_an_id(_id,'vert_');
				calc_vert(vid);
			};
			if(_id.match('horo_','ig'))
			{
				var hid = get_an_id(_id,'horo_');
				calc_horo(hid);
			};
			//check for grand total
			switch(_grand)
			{
				case 1:
				//run calc across last row
					calc_horo(_bits.length - 1);
				 	break;
				case 2:
				//run calc on last col
					calc_vert(_bits[0].length - 1);
					break;
			}
            checkconditions($(el).val(), $(el).attr('name'), $(el).attr('type'));
			return(true);
		};
		//retuns the id from end of string like 'vert_[id] horo_[id] other class'
		//_id = string
		//_break = string to break @
		function get_an_id(_id,_break)
		{
			var id = _id.split(_break);
			id[1] = id[1].split(' ');
			return(id[1][0] * 1);
		};
		//run vert calc on col[vid]
		function calc_vert(vid)
		{
			var i=0;
			var l=_bits.length;
			var qt = 0;
			//get or set the last ones id
			for(i=0; i<l; i++)
			{
				if(i == (l - 1))
				{
					//check if sum is a number
                    if(isNaN(qt))
                    {
                        _bits[i][vid].value = "Not a number";
                    }
                    else
                    {
                        _bits[i][vid].value = round(qt,12);
                    }
				}
				else if(_bits[i][vid].value)
				{
                    _aval=_bits[i][vid].value;
                    if (radix===',') {
                        _aval = _aval.split(',').join('.');
                    }
                    if  (_aval == parseFloat(_aval)) {
                        qt += +_aval;
                    }
				};
			};

		};
		//run horo calc on row[hid]
		function calc_horo(hid)
		{
			var i=0;
			var l=_bits[hid].length;
			var qt=0;
			for(i=0; i<l; i++)
			{
				if(i == (l - 1))
				{
					if (isNaN(qt))
                    {
                        _bits[hid][i].value = "Not a number"
                    }
                    else
                    {
                        _bits[hid][i].value = round(qt,12);
                    }
				}
				else if(_bits[hid][i].value)
				{
                    _aval=_bits[hid][i].value;
                    if (radix===',') {
                        _aval = _aval.split(',').join('.');
                    }
                    if  (_aval == parseFloat(_aval)) {
                        qt += +_aval;
                    }
				};
			};
		};
		//clear key input
		function dummy(e)
		{
			return(false);
		};
		//limit to numbers and .
		function _in_key(e)
		{
			e = e || window.event;
			//alert(e.keyCode);
			switch(e.keyCode)
			{
				case 8:
				case 9:
				case 48:
				case 49:
				case 50:
				case 51:
				case 52:
				case 53:
				case 54:
				case 55:
				case 56:
				case 57:
				case 190:
				case 45:
				case 35:
				case 40:
				case 34:
				case 37:
				case 12:
				case 39:
				case 36:
				case 38:
				case 33:
				case 46:
				case 96:
				case 97:
				case 98:
				case 99:
				case 100:
				case 101:
				case 102:
				case 103:
				case 104:
				case 105:
				case 110:
				case 109:
                case 189:
                case 188:
                    if (radix===',' && e.keyCode == 190) { return false; }
                    if (radix==='.' && e.keyCode == 188) { return false; }
					return(e.keyCode);
				default:
				//alert(e.keyCode);
					return(false);
					break;
			}
		}
	};
	//set up the dom
	//alert('multi called called value ' + ids);
	ids = ids.split(',');
	//generic for vars
	var ii = 0;
	var ll=ids.length;
	//object place holder
	var _collection=new Array();

	for(ii=0; ii<ll; ii++)
	{
		//run main function per id
		_collection.push(new multi_total(ids[ii]));
	}
}

//Special function for array dual scale in drop down layout to check conditions
function array_dual_dd_checkconditions(value, name, type, rank, condfunction)
{
   if (value == '') {
        //If value is set to empty, reset both drop downs and check conditions
        if (rank == 0) { dualname = name.replace(/#0/g,"#1"); }
        else if (rank == 1) { dualname = name.replace(/#1/g,"#0"); }
        document.getElementsByName(dualname)[0].value=value;
        condfunction(value, dualname, type);
   }
    condfunction(value, name, type);
}

/* Maxlengt on textarea */
function maxlengthtextarea(){
    // Calling this function at document.ready : use maxlength attribute on textarea
    // Can be replaced by inline javascript
    $("textarea[maxlength]").change(function(){ // global solution
        var maxlen=$(this).attr("maxlength");
        if ($(this).val().length > maxlen) {
            $(this).val($(this).val().substring(0, maxlen));
        }
    });
    $("textarea[maxlength]").keyup(function(){ // For copy/paste (not for all browser)
        var maxlen=$(this).attr("maxlength");
        if ($(this).val().length > maxlen) {
            $(this).val($(this).val().substring(0, maxlen));
        }
    });
    $("textarea[maxlength]").keydown(function(event){ // No new key after maxlength
        var maxlen=$(this).attr("maxlength");
        var k =event.keyCode;
        if (($(this).val().length >= maxlen) &&
         !(k == null ||k==0||k==8||k==9||k==13||k==27||k==37||k==38||k==39||k==40||k==46)) {
            // Don't accept new key except NULL,Backspace,Tab,Enter,Esc,arrows,Delete
            return false;
        }
    });
}


/* DRAG N DROP RANKING QUESTIONS */
// @param setItemssameSize, Boolean, whether to have items the same size or not
function readyRankingQuestion(qID, maxAnswer, conditionFunction, setItemsSameSize) { 
	// Set up the connected sortable (the drag and drop using jquery ui
	var sortable1 = '#sortable1'+qID+'';
	var sortable2 = '#sortable2'+qID+'';
	var defaultPlaceholderHeight = 0;
			
	$(sortable1+', '+ sortable2).sortable({ 			
		connectWith: '.connectedSortable'+qID+'',
		placeholder: 'ui-sortable-placeholder',
		helper: function( event, element ) { 
			return element.clone().addClass("ui-sortable-helper");
		} ,
		items: '.state-sorted',
		revert: 50,
		stop: function(event, ui) {  			
			refreshAndUpdateRankingQuestion(qID, conditionFunction);
			refreshBackgroundOfRankingQuestion(qID, ui, defaultPlaceholderHeight);
		} ,
		create: function(event, ui) { 
			refreshBackgroundOfRankingQuestion(qID, ui, defaultPlaceholderHeight);
			if (setItemsSameSize) {defaultPlaceholderHeight = setSameHeightForRankingChoices(qID);}
		} ,
		start: function(event, ui) { 
			//make sure the background is displayed correctly
			ui.placeholder.height(ui.item.height());
			refreshBackgroundOfRankingQuestion(qID, ui, defaultPlaceholderHeight);
		} ,	
		change: function(event, ui) {
			refreshBackgroundOfRankingQuestion(qID, ui, defaultPlaceholderHeight);
		} ,
		forcePlaceholderSize: true,
		scrollSensitivity: 40,
		tolerance: 'pointer'
	} ).disableSelection();
	
	
	// enforce maximum answers intuitively
	$(sortable1 + ' li').mousedown(function(){  
        // Check number of elements already present in every possible destination (namely sortable2)
	    $(sortable2).not($(this).parent()).each(function(){  // somtimes sortable1 li is already in sortable2 due to jQuery lack of updating DOM
	    	$destination = $(this);
	    	$destinationUI = $(this).prev('.DDRbackground');
			// disable possible destinations if they're already maxed out
	        if($destination.find('.ui-state-default').length >= maxAnswer){  
	            $destination.sortable('disable');
	            $destinationUI.addClass('dragDropRankMaxedOut');
	        }  else { 
	            $destination.sortable('enable');
	            $destinationUI.removeClass('dragDropRankMaxedOut');
	        } 
	    } );
	} );
	
	// Allow users to double click to move to selections from list to list
	$(sortable1 +' li').live('dblclick', function() { 
		if($(sortable2+' .ui-state-default').length == maxAnswer) { 
			$(sortable2).prev('.DDRbackground').addClass('dragDropRankMaxedOut');
			return false;
		} 
		else { 
			$(this).appendTo(sortable2);
			refreshAndUpdateRankingQuestion(qID, conditionFunction);
			refreshBackgroundOfRankingQuestion(qID, ui, defaultPlaceholderHeight);
		} 
	} );
	$(sortable2 +' li').live('dblclick', function() { 
		$(this).appendTo(sortable1);
		refreshAndUpdateRankingQuestion(qID, conditionFunction);
		refreshBackgroundOfRankingQuestion(qID, ui, defaultPlaceholderHeight);
	} );
} 

/* eliminate bias and make all options the same height */
function setSameHeightForRankingChoices(qID) {
	var biggestHeight = 0;
	var sortable1 = '#sortable1'+qID+'';
	var sortable2 = '#sortable2'+qID+'';
	
	$(sortable1 + '  li,' + sortable2 + '  li' ).each(function(index) { 
		// could be more efficient, but JS is pretty fast now, todo
		var sNumberPrefix = "<span class='DDRnumberprefix'>"+0+"</span>";
		$(this).prepend(sNumberPrefix);
		if ($(this).height()>biggestHeight) biggestHeight = $(this).height();
		$(this).children('.DDRnumberprefix').remove();
	});
	$(sortable1 + '  li,' + sortable2 + '  li' ).height(biggestHeight);
	return biggestHeight;
}

	
/* update background of drag/drop to match */
function refreshBackgroundOfRankingQuestion(qID, ui, defaultPlaceholderHeight) {  
	var sortable1 = '#sortable1'+qID+'';
	var sortable2 = '#sortable2'+qID+'';
	// go through each background li and give each the same text as the item above it
	$('#question' + qID + ' .DDRbackground li').each(function(index) { 
		
		//(object = any visible placeholder or original that's not a helper )
		
		var sNot = ".ui-sortable-helper";
		var $object = $(sortable2+' li:visible').not(sNot).eq(index);
		
		if ($object.length!=0) {  // if there is an object
			//$(this).text($object.text());
			$(this).height($object.height());
		}  else { 
			//$(this).text(index+1+'.');
			//$(this).text('');
			if (defaultPlaceholderHeight==0) {	
				//no default phheight
				$(this).height('auto');
			} else {
				$(this).height(defaultPlaceholderHeight);
			}
		} 
	} );
	
	
	$(sortable2+', '+sortable1).children('li:visible').children('.DDRnumberprefix').remove();	
		
	$(sortable2+', '+sortable1).children('li:visible').not(sortable1+' li').not('.ui-sortable-helper').each(function(index) {
		// the ones that should have an index
		var sNumberPrefix = "<span class='DDRnumberprefix'>"+(index+1)+"</span>";
		if ($(this).hasClass('ui-sortable-placeholder')) {
			// placeholder shouldn't have prefix, and helper should
			// $(this).siblings('.ui-sortable-helper').prepend(sNumberPrefix);
			// helper = $(ui.helper)
			$(ui.helper).prepend(sNumberPrefix);
			if (defaultPlaceholderHeight==0) {	
				$(ui.helper).height('auto');
				$(this).height($(ui.helper).height());
			}
		} else {
			$(this).prepend(sNumberPrefix);
			if (defaultPlaceholderHeight==0) {	
				$(this).height('auto');
			}
		}
		
	});
	
} 


/* resets displays, refreshes sortables, and updates input data */
function refreshAndUpdateRankingQuestion(qID, conditionFunction) { 
	var sortable1 = '#sortable1'+qID+'';
	var sortable2 = '#sortable2'+qID+'';
	$(sortable1).sortable('refresh').sortable('enable');
	$(sortable2).sortable('refresh').sortable('enable').prev('.DDRbackground').removeClass('dragDropRankMaxedOut');
	updateDragDropRank(qID, conditionFunction);
} 

function updateDragDropRank(qID, conditionFunction)
{ 
	var sortable1 = '#sortable1'+qID+'';
	var sortable2 = '#sortable2'+qID+'';
	var rankedIDs = [];
	$(sortable2+' li').each(function(index) { 
		// Get id of ranked item
		var liID = $(this).attr("id");
		liIDArray = liID.split('_');	
		// Save to an array (slot number => chosen value)
		rankedIDs[rankedIDs.length] = liIDArray[1];
	} );

	$('#question'+qID+' .hiddenRankingInputs').children('input[id^="fvalue_"]').each(function(index) { 
		// cycle through each hidden input field, each of which correspond with a possible ranking
		if (rankedIDs.length > index) {  // if there is a ranking for this field
			$(this).val(rankedIDs[index]);
		}  else { 
			$(this).val('');
		} 
		
  	} );
  	
  	// check conditions, show other questions
	conditionFunction();
		
} 
