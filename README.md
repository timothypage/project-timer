# Simple Project Timer

you can see it in action at http://zwolak.me/projects/timer

it uses the localStorage adapter for backbone models to persist data in the browser, nothing is saved serverside

project code is located at https://github.com/timothypage/project-timer

TODO:

 - this will keep running in the tab if it is left open and you put the computer to sleep.  Maybe ignore Datetime differences of more than 5 minutes?

 - Allow updating of time through the web interface, right now you'll have to use the javascript console:
	
	> var hours = 60 * 60;
	> var minutes = 60;

	> Timers.first().set( "seconds", ( 1 * hours ) + ( 15 * minutes ) )
