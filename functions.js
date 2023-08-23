"use strict";

//Called when current user presses the Search button
//Retrieves from the back-end the info for the movie that matches the user input (if any)
//Creates all the DOM elements for the presentation of this movie (including the rating stars)
function fetchMovieData() {
	var xmlhttp = new XMLHttpRequest();
	//Retrieve the DOM element where the movies' data will be inserted	
	var moviesContainer = document.getElementById("movies_info");
	//Delete old search results, if any
	moviesContainer.innerHTML = "";

	//Retrieve the DOM elements of the previously recommended movies, if any
	var recommendedMovies = [...document.getElementsByClassName("recommended")];
	//And the button, if there is one
	var rec_button = document.getElementById("rec_btn");
	//And the user_not_found
	var user_not_found = document.getElementById("user_not_found");
	//Delete old recommendations if any (and the button)
	if(recommendedMovies[0] != undefined) {
		for(let i = 0;i < recommendedMovies.length; i++) {
			recommendedMovies[i].previousSibling.remove(); //remove the br
			recommendedMovies[i].parentNode.removeChild(recommendedMovies[i]);
		}
		rec_button.parentNode.removeChild(rec_button);
	}		
	//And the user not found <p>
	if(user_not_found !== null) {
		user_not_found.parentNode.removeChild(user_not_found);
	}

	//Get and refine user input
	var input = document.getElementById("input").value.trim();

	//Proceed to POST request
	var url = "http://62.217.127.19:8010/movie";
	xmlhttp.open("POST", url, true);
	xmlhttp.setRequestHeader('Content-Type','application/json');
	xmlhttp.send(JSON.stringify({"keyword":input}));

	xmlhttp.onreadystatechange = function() {
  		if (this.readyState == 4 && this.status == 200) {
			var movies = JSON.parse(this.responseText);
			if(movies[0]!=undefined) {	
				//Create the div element that will contain all the info and the stars
				var info_and_rating_container = document.createElement('div');
				info_and_rating_container.className = "single_movie_container"
				//Create the p element that will contain all the info
				var id = document.createElement('p');
				var title = document.createElement('p');
				title.id = "title";
				id.id = "id";
				var genres = document.createElement('p');
				var br1 = document.createElement('br');
				var br2 = document.createElement('br');
				// Create the div structure with the rating stars
				var stars_container = document.createElement('div');
				stars_container.className = "rating";
				for(let i=0; i < 10 ; i++) {
					var star = document.createElement('i');
					star.className = "rating__star far fa-star";
					stars_container.appendChild(star); //Apppend the stars' structure to the containers
				}
				//Fill the data
				id.innerHTML = "ID: "+movies[0].movieId;
				title.innerHTML = "Title: "+movies[0].title;
				genres.innerHTML = "Genres: "+movies[0].genres;

				//Append the data to the DOM
				info_and_rating_container.appendChild(id);
				info_and_rating_container.appendChild(br1);
				info_and_rating_container.appendChild(title);
				info_and_rating_container.appendChild(br2);
				info_and_rating_container.appendChild(genres);
				info_and_rating_container.appendChild(stars_container);
				moviesContainer.appendChild(info_and_rating_container);

				var ratingStars = [...document.getElementsByClassName("rating__star")];
				ratingStarsFunc(ratingStars);			
    		} else {
				var gen_info = document.createElement('p');
    			gen_info.innerHTML = "Movie not found!";
				moviesContainer.appendChild(gen_info);
			}					
   		}
	};
}

//Called by fetchData() [the above one]
//Regulates the rating stars operations and gets the current user's ratings
//(which are produced every time he clicks at a star)
function ratingStarsFunc(stars) {
	var starClassActive = "rating__star fas fa-star";
	var starClassInactive = "rating__star far fa-star";
	var starsLength = stars.length;
	let i;
	stars.map((star) => {
		star.onclick = () => {		
			i = stars.indexOf(star);
			var currentStar = i;
			//Get the movieId from DOM, but remove the initial string "ID: "
			var movieId = document.getElementById("id").innerHTML.slice(4);
			//Before storing the rating for this movie
			//Check whether the movie is already rated
			var isNotAlreadyRated = sessionStorage.getItem(movieId) === null;		
			if(isNotAlreadyRated) {
				//if there are three movies already rated
				if(sessionStorage.length === 3) {
					//get a random integer between 0 and 2
					var rndInt = getRandomInteger(0,2);
					//and remove a random movie, so that after the 
					//storage of the new movie, there will be again three
					sessionStorage.removeItem(Object.keys(sessionStorage)[rndInt]);
				}
			}
			if (star.className===starClassInactive) {
			   	for (i; i >= 0; --i) stars[i].className = starClassActive;	
				//Store the rating for this movie
			   	sessionStorage.setItem(movieId, (currentStar+1)/2.0);
			} else {
				for (i; i < starsLength; ++i) stars[i].className = starClassInactive;
				//Store the rating for this movie
				sessionStorage.setItem(movieId, currentStar/2.0);
		   	}
		  	showRecommendationsBtn();
	   	};
   	});
}

//Called by ratingStarsFunc() [the above one]
//Creates the recommendations button
function showRecommendationsBtn() {
	var moviesContainer = document.getElementById("movies_info");
   	//be sure not to insert second same button
   	var buttonDoesntExist = document.getElementById("rec_btn") === null;
	//if the stored rated movies are 3 
	if(sessionStorage.length === 3) {
		// and button doesn't exist
		if(buttonDoesntExist) { 
			let recommendation_btn = document.createElement('button');
			recommendation_btn.id = "rec_btn";
			recommendation_btn.innerHTML = "Show the recommendations!";
			recommendation_btn.setAttribute("onclick","fetchRatings()");
			insertAfter(recommendation_btn,moviesContainer);
		} else {
			let recommendation_btn = document.getElementById("rec_btn");
			recommendation_btn.innerHTML = "Show the recommendations!";
		}
	}
}

//Called when current user presses the Show Recommandations button
//Retrieves from the back-end the ratings for the movies the current user has rated
//Gets the most similar user with the current one
//Calls fetchUserMovies()
function fetchRatings() {
	var xmlhttp = new XMLHttpRequest();

	//Get the stored ids:
	var myIds = Object.keys(sessionStorage);
	//Convert the ids from strings to numbers
	for (var i = 0; i < myIds.length; i++) myIds[i] = +myIds[i];

	var rec_btn = document.getElementById("rec_btn");
	rec_btn.innerHTML = "We are fetching your recommendations, please wait";
	//Proceed to POST request
	var url = "http://62.217.127.19:8010/ratings";
	xmlhttp.open("POST", url, true);
	xmlhttp.setRequestHeader('Content-Type','application/json');
	xmlhttp.send(JSON.stringify({"movieList": myIds }));

	xmlhttp.onreadystatechange = function() {
  		if (this.readyState == 4 && this.status == 200) {
			var moviesRatings = JSON.parse(this.responseText);
			var mostSimilarUser = getMostSimilarUser(moviesRatings,myIds);
			if(mostSimilarUser !== undefined) {
				fetchUserMovies(mostSimilarUser);
			} else {
				//If you haven't already printed the not found message
				if(document.getElementById("user_not_found") === null) {
					let userNotFound = document.createElement('p');
					userNotFound.id = "user_not_found";
					userNotFound.innerHTML = "No similar users found, therefore no recommendations can be proposed, please search for another movie!";
					insertAfter(userNotFound,rec_btn);
				}
			}
   		}
	};
}

//Called by fetchRatings() [the above one]
//Retrieves from the back-end the ids of the movies that the similar user has rated
//Gets 10 of the best rated movies
//Calls fetchMovieById()
function fetchUserMovies(mostSimilarUser) {
	var xmlhttp = new XMLHttpRequest();
	//Proceed to GET request
	var url = "http://62.217.127.19:8010/ratings/"+mostSimilarUser;
	xmlhttp.open("GET", url, true);
	xmlhttp.setRequestHeader('Content-Type','application/json');
	xmlhttp.send();
	xmlhttp.onreadystatechange = function() {
  		if (this.readyState == 4 && this.status == 200) {
			var userMovies = JSON.parse(this.responseText);
			var proposedMovieId;
			for(let i = 0; i<10; i++) {
				var rndInt = getRandomInteger(0, userMovies.length);
				var maxRating = 0;
				//Find the max rating this user has ever made
				for(let movie in userMovies) {
					let individualRating = parseInt(userMovies[movie].rating);
					if(maxRating < individualRating) maxRating = individualRating;
				}
				//Then find the first movie with this rating, and save its movieId
				for(let movie in userMovies) {
					if(userMovies[movie] !== undefined) {
						let individualRating = parseInt(userMovies[movie].rating);
						if(maxRating === parseInt(individualRating)) {
							proposedMovieId = userMovies[movie].movieId;
							// And delete this specific object (set to undefined)
							// In order not to reselect it
							delete userMovies[movie];
							//And break in order not to proceed to the next movie with the same rating
							break;						
						}
					}					
				}
				fetchMovieById(proposedMovieId);
			}			
   		}
	};
}

//Called by fetchUserMovies() [the above one]
//Retrieves from the back-end the info of a movie, by id
//Creates all the DOM elements for the presentation of this movie 
function fetchMovieById(movieId) {
	var xmlhttp = new XMLHttpRequest();

	var rec_btn = document.getElementById("rec_btn");
	//Hide the button
	rec_btn.style.display = "none";

	//Proceed to GET request
	var url = "http://62.217.127.19:8010/movie/"+movieId;
	xmlhttp.open("GET", url, true);
	xmlhttp.setRequestHeader('Content-Type','application/json');
	xmlhttp.send();
	xmlhttp.onreadystatechange = function() {
  		if (this.readyState == 4 && this.status == 200) {
			var movie = JSON.parse(this.responseText);
			var movieString = JSON.stringify(movie);
			// Create the div element that will contain all the info and the stars
			var flex_div = document.createElement('div');
			flex_div.className = "data recommended";
			var proposed_movies_container = document.createElement('div');
			proposed_movies_container.className = "single_movie_container";
			//Create the p element that will contain all the info
			var title = document.createElement('p');
			var genres = document.createElement('p');
			var br1 = document.createElement('br');
			var br2 = document.createElement('br');
			//Fill the data
			id.innerHTML = "ID: "+movie[0].movieId;
			title.innerHTML = "Title: "+movie[0].title;
			genres.innerHTML = "Genres: "+movie[0].genres;
			//Append the data to the DOM
			proposed_movies_container.appendChild(title);
			proposed_movies_container.appendChild(br1);
			proposed_movies_container.appendChild(genres);
			flex_div.appendChild(proposed_movies_container);
			insertAfter(br2,rec_btn); //A little space after the movie
			insertAfter(flex_div,br2); 	
   		}
	};
}

//Called by fetchRatings() (lines 74 - 101)
//Filters the array given from back end, with all the ratings for the movies specified
//Discards all the users that haven't rated all the movies the current user has rated
//Creates the vectors with the wanted ratings of the other users
//Calls executePearson and gets the correlation values for each other user
//Finds the max correlation value, and the user that corresponds to it (this is the most similar user)
//Returns the most similar user
function getMostSimilarUser(moviesRatings,myIds) {
	//First, create a dictionary with all the userIds and their number of appearances in the array
	var userIdsCounter;  
	for(let column in moviesRatings) {
		for(let user in moviesRatings[column]) {
			var userId = moviesRatings[column][user].userId;
			if(userIdsCounter === undefined) userIdsCounter = {};
			if(userIdsCounter[userId] === undefined) {
				userIdsCounter[userId] = 1;
			} else {
				userIdsCounter[userId]++;
			}
		}
	}

	//Then, create a dictionary with the userIds that appear at all the columns, 
	//along with their ratings at each column (that is, for each movie)
	var usefulUserIdsRatings;
	for(let column in moviesRatings) {
		for(let user in moviesRatings[column]) {
			var userId = moviesRatings[column][user].userId;
			if(userIdsCounter[userId] === moviesRatings.length) {
				if(usefulUserIdsRatings === undefined) usefulUserIdsRatings = {};
				if(usefulUserIdsRatings[userId] === undefined) usefulUserIdsRatings[userId] = {};
				if(usefulUserIdsRatings[userId][myIds[column]] === undefined) {
					usefulUserIdsRatings[userId][myIds[column]] = {};
				}
				usefulUserIdsRatings[userId][myIds[column]] = moviesRatings[column][user].rating;
			}
		}
	}
	//Gets the ratings the current user has created
	var myRatings = [];
	for(let i = 0; i < myIds.length;i++) {
		myRatings[i] = parseInt(sessionStorage.getItem(myIds[i]));
	}

	var allMyRatingsAreTheSame = true;
	for(let i = 1; i < myRatings.length; i++) {
		if(myRatings[0] !== myRatings[i]) allMyRatingsAreTheSame = false;
	}
	if(allMyRatingsAreTheSame) myRatings[0] += 0.1; //then alter a little bit the ratings,
	//because otherwise we will get all myStd === 0.

	//Create arrays with another user's ratings, and call executePearson; then find the most similar user
	var pearsonResults = [];
	var usefulUsers = [];
	let singleUserPos = 0;
	for(let user in usefulUserIdsRatings) {
		var arrayWith3Ratings = [];
		let singleRatingPos = 0;
		for(let rating in usefulUserIdsRatings[user]) {
			arrayWith3Ratings[singleRatingPos] = parseInt(usefulUserIdsRatings[user][rating]);
			singleRatingPos++;
		}
		if(allMyRatingsAreTheSame) {
			//and change by the same value the other user's rating too
			arrayWith3Ratings[0] += 0.1;
		}
		var singlePearsonRes = executePearson(arrayWith3Ratings,myRatings);
		if(!isNaN(singlePearsonRes)) {
			pearsonResults[singleUserPos] = singlePearsonRes;
			usefulUsers[singleUserPos] = user;		
			singleUserPos++;
		}
	}
	var mostSimilarUser = usefulUsers[pearsonResults.indexOf(Math.max(...pearsonResults))];
	return mostSimilarUser;
}

//Called by getMostSimilarUser() [the above one]
//Calculates the Pearson Correlation Coefficient of two populations (arrays)
function executePearson(otherUserRatings,myRatings) {
	var res;
	var otherStd = std(otherUserRatings);
	var myStd = std(myRatings);
	res = covariance(otherUserRatings,myRatings)/(otherStd*myStd);
	return res;
}

//Find standard deviation
function std(array) {
	var n = array.length;
	var res = Math.sqrt(array.map(x => Math.pow(x - mean(array), 2)).reduce((a, b) => a + b) / n);
 	return res;
	
}

//Find population covariance
function covariance(arr1, arr2) {
	if(arr1.length === arr2.length) {
		var mean1 = mean(arr1);
		var mean2 = mean(arr2);
		var sum = 0;
		for(let i = 0; i < arr1.length; i++) {
			sum += (arr1[i] - mean1) * (arr2[i] - mean2);
		}					 
		var res = sum / (arr1.length); //if we want sample covariance, must do sum / (arr1.length - 1)
		return res;
	} else {
		console.log("COVARIANCE ERROR: THE ARRAYS ARE OF DIFFERENT LENGTHS");
		return undefined;
	}
   
}

//Find mean
function mean(arr) {
    let sum = 0;
    for(let i = 0; i < arr.length; i++) {
		sum += arr[i];
	}
	var res = sum / arr.length;
	return res;
}

//Default page reloading at hitting 'enter' prevented
function preventDefault(event) {
	event.preventDefault();
}

//But wait until DOM is loaded, before preventing default behavior
document.addEventListener("DOMContentLoaded", function(event) { 
	var form = document.getElementById('my_form');
	form.addEventListener('submit', preventDefault);
});

//Inserts at the DOM, the newNode just after the referenceNode
function insertAfter(newNode, referenceNode) {
    referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
}

//Returns a random integer at the [min, max]
function getRandomInteger(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

//Deletes the session storage with each refresh
function deleteSessionStorage() {
	sessionStorage.clear();
	console.log("session storage cleared");
}
// deleteSessionStorage();

// Sources:
// a) for the rating stars manipulation: https://dev.to/leonardoschmittk/how-to-make-a-star-rating-with-js-36d3
// b) for the math calculations for covariance and mean: https://www.geeksforgeeks.org/program-find-covariance/
// c) for the math calculations for standard deviation: https://stackoverflow.com/questions/7343890/standard-deviation-javascript/32201390
// d) for insertAfter function: https://stackoverflow.com/questions/4793604/how-to-insert-an-element-after-another-element-in-javascript-without-using-a-lib
// e) for the preventDefault function: https://developer.mozilla.org/en-US/docs/Web/API/HTMLFormElement/submit_event
// f) for the session storage keys: https://stackoverflow.com/questions/41826355/javascript-retrieve-all-keys-from-sessionstorage
// g) for the + preffix (string to number): https://stackoverflow.com/questions/39358524/change-the-data-type-in-the-array-of-objects/39358622
// h) for the covariance of population: https://calculator-online.net/covariance-calculator/
// i) for the random number generator: https://css-tricks.com/lots-of-ways-to-use-math-random-in-javascript/
// k) for converting string array to integer array: https://stackoverflow.com/questions/10541770/convert-string-array-to-integer-array/21644513
// l) Justification for the setting of pearson to 0 in case of std === 0: https://stats.stackexchange.com/questions/9068/pearson-correlation-of-data-sets-with-possibly-zero-standard-deviation