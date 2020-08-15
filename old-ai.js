var TARGET_ERROR = 0.00001;


Array.prototype.equals = function (otherArray) {
	for (var i = 0; i < otherArray.length; i ++) {
		if (this[i] !== otherArray[i]) {
			return false;
		}
	}
	return true;
};

greedyWalk();

function greedyWalk() {

	var currentGuess = new Array(5).fill(Math.random).map(rng => rng());
	var currentScore = cost(currentGuess);
	console.log(currentGuess, currentScore);

	var convergentFamily = {
		size: 0,
		max: currentScore,
		update: function (newScore) {
			if (this.max / newScore <= 1.001) {
				this.size ++;
			} else {
				this.max = newScore;
				this.size = 1;
			}
		},
		hasConverged: function () {
			return this.size >= 10;
		}
	};

	for (var iteration = 0; currentScore >= TARGET_ERROR && iteration < 1e3; iteration ++) {
		// Make a new guess.
		// Each value has a 50% chance of being scaled.
		var newGuess = currentGuess.map(currentCoefficient => {
			var sensitivity = Math.log(currentScore / TARGET_ERROR) / 100;
			// console.log(sensitivity);
			var scale = (1 - sensitivity) + 2 * Math.random() * sensitivity;// Multiply by something in [1 - sens, 1 + sens)
			return Math.random() < 0.5 ? scale * currentCoefficient : currentCoefficient;
		});

		if (convergentFamily.hasConverged()) {// Has converged
			newGuess.push(Math.random() - 0.5);// Throw in something from [-0.5, 0.5)
		}

		if (newGuess.equals(currentGuess)) {
			continue;
		}

		// Step if the new guess has a lower score.
		var newScore = cost(newGuess);
		if (newScore < currentScore) {
			currentGuess = newGuess;
			currentScore = newScore;
			convergentFamily.update(newScore);

			console.log(currentGuess, currentScore, convergentFamily.size);
		}
		// console.log(newGuess, newScore);
	}

	// console.log(currentGuess, currentScore);
}



/**
 * The cost/loss function to score the suggested Taylor expansion. Aim to minimize this.
 * 
 * @params array[float] coefficients The list of coefficents.
 * @return float The score representing the error from the desired function
 */
function cost(coefficients) {
	var candidate = tester(coefficients);
	var reality = (x) => Math.sin(x);
	var test_range = range(-Math.PI, Math.PI, 0.05);
	return test_range
		.map(x => Math.abs(reality(x) - candidate(x)))
		.reduce((sum, a) => sum + a, 0);
}

// return { x | x E [start,end) and (x - start) mod step = 0 }
function range(start, end, step = 1) {
	var size = Math.ceil((end - start) / step);
	var vector = [...Array(size).keys()];
	return vector.map(x => x * step + start);
}

// Used by cost() to build the candidate polynomial function 
function tester(coefficients) {
	return function (x) {
		return coefficients
			.map((coefficient, idx) => coefficient * Math.pow(x, idx))
			.reduce((sum, a) => sum + a, 0);
	};
}



// var guess = function (x) {
// 	return x - Math.pow(x, 3) / 6 + Math.pow(x, 5) / 120;
// };

// function inclusive_range(start, end, step) {
// 	var vector = range(start, end, step);
// 	if (vector[vector.length - 1] !== end) {
// 		vector.push(end);
// 	}
// 	return vector;
// }