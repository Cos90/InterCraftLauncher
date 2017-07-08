var viewport;
var currentView = 'dashboard';

var init = function() {
	viewport = $("#viewport");
	loadView('dashboard');
};

var setProfiles = function(profiles) {
	var item;

	$('.launcher-profile-link').remove();

	for (var i = profiles.length - 1; i > -1; i--) {
		item = $("<a>", {"class": "dropdown-item launcher-profile-link", "href": "#"});
		itemRadio = $('<input>', {"type": "radio", "name": "launcher-profile-id", "value": profiles[i].key, "id": profiles[i].key});
		item.attr('index', i);
		itemRadio.attr('index', i);
		item.append(profiles[i].displayName);
		item.append(itemRadio);
		$('#launcher-profile-dropdown').prepend(item);
		item.click(function() {
			$(this).children('input').prop('checked', true);
			$('#launcher-profile-button').html($(this).html());
		});
	}
	$('.launcher-profile-link').eq(0).click();
};

var loadView = function(view) {
	console.log(`Loading view: ${view}`);
	ipcSend('view_load', {
		'key': 'control_panel',
		'view': view
	});
};

var displayView = function(view) {
	$view = $(view).addClass('unloaded');
	$('#viewport').html($view);
	console.log($view);
	$view.each(function(index) {
		var $v = $(this);
		setTimeout(function() {
			console.log("Adding class");
			$v.removeClass('unloaded');
		}, 100*(index+1));
	});
};

var setView = function(view) {
	if (view == currentView)
		return;
	console.log("View can be loaded");
	$('.sidenav-item > .active').removeClass('active');
	$(`.sidenav-tab[view='${view}']`).addClass('active');
	currentView = view;
	loadView(view);
};

$(document).ready(function() {
	init();
	
	$('.sidenav-tab').click(function(e) {
		setView($(this).attr('view'));
	});

	$('.sidenav-dropdown-tab').click(function(e) {
		console.log("Clicked");
		var hasClass = $(this).hasClass('toggled')
		$('.sidenav-item .toggled').removeClass('toggled');
		if (!hasClass) {
			$(this).addClass('toggled');
		}
	});

	$('#launcher-profile-button').click(function() {
		ipcSend('control_panel_launch_minecraft', {
			'profile': $('input[name=launcher-profile-id]:checked').val()
		});
	});
});

ipcReceive('control_panel_preload_launcher_profiles', function(payload) {
	console.log("Preloading launcher profiles");
	setProfiles(payload);
});

ipcReceive('control_panel_preload_done', function(payload) {
	console.log("Finished preloading...");
	ipcSend('control_panel_done', true);
});

ipcReceive('view_result', function(payload) {
	console.log("Got a view");
	if (payload.key == "control_panel")
		if (currentView == payload.view)
			displayView(payload.html);
});