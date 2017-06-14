var content;

var init = function() {
	content = $("#content");
};

var setProfiles = function(profiles, defaultIndex = 0) {
	var profile;
	var name;
	var keys = Object.keys(profiles);
	var item;

	$('.launcher-profile-link').remove();

	for (var i = 0; i < keys.length; i++) {
		var name;
		profile = profiles[keys[i]];
		if (profile.name == undefined) {
			if (profile.type == 'latest-release')
				name = "Latest Release";
			else if (profile.type == 'latest-snapshot')
				name = "Latest Snapshot";
			else
				continue;
		} else
			name = profile.name;
		item = $("<a>", {"class": "dropdown-item launcher-profile-link", "href": "#"});
		itemRadio = $('<input>', {"type": "radio", "name": "launcher-profile-id", "value": keys[i], "id": keys[i]});
		item.attr('index', i);
		itemRadio.attr('index', i);
		item.append(name);
		item.append(itemRadio);
		$('#launcher-profile-dropdown').prepend(item);
		item.click(function() {
			$(this).children('input').prop('checked', true);
			$('#launcher-profile-button').html($(this).html());
		});
	}
	$('.launcher-profile-link').eq(defaultIndex).click();
};

ipcReceive('control_panel_preload_launcher_profiles', function(payload) {
	console.log("Preloading launcher profiles");
	setProfiles(payload);
});

ipcReceive('control_panel_preload_done', function(payload) {
	console.log("Finished preloading...");
	ipcSend('control_panel_done', true);
});

$(document).ready(function() {
	init();
	
	$('.sidenav-tab').click(function(e) {
		$('.sidenav-item > .active').removeClass('active');
		$(e.target).addClass('active');
	});

	$('.sidenav-dropdown-tab').click(function(e) {
		var hasClass = $(e.target).hasClass('toggled')
		$('.sidenav-item .toggled').removeClass('toggled');
		if (!hasClass) {
			$(e.target).addClass('toggled');
		}
	});

	$('#launcher-profile-button').click(function() {
		ipcSend('control_panel_launch_minecraft', {
			'profile': $('input[name=launcher-profile-id]:checked').val()
		});
	});
});