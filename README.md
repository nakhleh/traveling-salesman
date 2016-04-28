# Traveling Salesman Problem #

This web app implements a simple genetic algorithm approach to solving the
Traveling Salesman Problem, visualizing the route on the globe and showing
the algorithm's progress through graphs, etc.

## Running the app ##

After cloning the repo, run (once):

    npm install

to install the dependencies, then build with:

    gulp

and run it using:

    node server.js

Access it on port 8080.  Sorry, I haven't put any polyfills in place, and no
error handling, so you'll need a very modern version of Chrome or Firefox.
