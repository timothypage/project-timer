var hours = 60 * 60;
var minutes = 60;

function incrementModelSeconds(model_id) {
	var model = Timers.get(model_id);
	if ((typeof model.milliseconds != "undefined") && model.prevDatetime) {

		time_delta = new Date - model.prevDatetime
		total_elapsed_time_in_ms = model.milliseconds + time_delta
		whole_seconds = Math.floor(total_elapsed_time_in_ms / 1000);
		remainder = total_elapsed_time_in_ms % 1000;

		// skip over timer jumps over 15 minutes, computer probably asleep.
		if (whole_seconds > (15 * minutes)) {
			model.prevDatetime = new Date;
			model.milliseconds = 0;
			return
		}

		model.set('seconds', (model.get('seconds') + whole_seconds));
		model.save();
		// 
		model.milliseconds = remainder

	} else {

		model.milliseconds = 0;

	}

	model.prevDatetime = new Date;
}

// zero pad numbers in the timer so its of the format "HH:MM:SS"
function pad(n, width, z) {
	z = z || '0';
	n = n + '';
	return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

var Timer = Backbone.Model.extend({
	defaults: function() {
		return {
			project: "",
			notes: "",
			seconds: 0,
			interval_id: 0
		}
	}
});

var TimerList = Backbone.Collection.extend({
	model: Timer,
	localStorage: new Backbone.LocalStorage("timer-backbone")
});

var Timers = new TimerList;

var TimerView = Backbone.View.extend({
	tagName: "div",
	template: _.template($('#timer-template').html()),
	time_template: _.template($('#timer-time-template').html()),
	events: {
		"click .destroy": "clear",
		"click .start-timer": "start",
		"click .stop-timer": "stop",
		"blur .edit": "saveFields"
	},
	initialize: function() {
		this.listenTo(this.model, 'add', this.render);
		this.listenTo(this.model, 'change:seconds', this.updateTime);
		this.listenTo(this.model, 'change:interval_id', this.render);
		this.listenTo(this.model, 'destroy', this.remove);
	},
	render: function() {
		attrs = this.model.toJSON();
		attrs['running'] = (this.model.running ? 'Stop' : 'Start');
		attrs['running_class'] = (this.model.running ? 'stop-timer' : 'start-timer');
		this.$el.html(this.template(attrs));
		this.updateTime();
		return this;
	},
	clear: function() {
		clearInterval(this.model.get('interval_id'));
		this.model.destroy();
	},
	start: function() {
		var interval_id = setInterval(incrementModelSeconds, 1000, this.model.id);
		this.model.running = true;
		this.model.save({
			interval_id: interval_id
		});
	},
	stop: function() {
		clearInterval(this.model.get("interval_id"));
		this.model.running = false;
		this.model.prevDatetime = false;
		this.model.save({
			interval_id: 0
		});
	},
	saveFields: function() {
		this.model.save({
			project: this.$('input[name="project_title"]').val(),
			notes: this.$('textarea[name="project_notes"]').val()
		});
	},
	updateTime: function() {
		attrs = {};
		attrs['hours'] = pad(Math.floor(this.model.get("seconds") / 3600), 2);
		attrs['minutes'] = pad((Math.floor(this.model.get("seconds") / 60) % 60), 2);
		attrs['seconds'] = pad((this.model.get("seconds") % 60), 2);
		attrs['fraction'] = (this.model.get("seconds") / 3600).toFixed(2);
		this.$el.find('.timer-time').html(this.time_template(attrs));
	}
});

var AppView = Backbone.View.extend({
	el: $("#timerapp"),
	events: {
		"click #one-more-timer": "createTimer",
		"click #clear-all-timers": "clearAllTimers"
	},
	initialize: function() {
		this.listenTo(Timers, 'add', this.addOne);
		this.listenTo(Timers, 'reset', this.render);
		this.listenTo(Timers, 'remove', this.render);
		Timers.fetch();
	},
	render: function() {
		$('#timer-list').html('');
		Timers.each(this.addOne, this);
	},
	createTimer: function(e) {
		Timers.create();
	},
	addOne: function(timer) {
		var view = new TimerView({
			model: timer
		});
		this.$("#timer-list").append(view.render().el);
	},
	clearAllTimers: function() {
		Timers.each(function(timer) {
			clearInterval(timer.get('interval_id'));
		});
		Timers.reset();
		window.localStorage.clear();
		return false;
	}
});

var App = new AppView;

// reset timers 
Timers.each(function(timer) {
	timer.running = false;
});