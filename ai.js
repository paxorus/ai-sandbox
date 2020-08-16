/**
 *
 */

Array.prototype.sum = (keyFunction) => this.reduce((acc, x) => acc + keyFunction(x), 0);

function greedyWalk({initialPolynomialSize, numIterations}) {

	var currentGuess = new Array(initialPolynomialSize).fill(null).map(() => Math.random());
	var currentScore = cost(currentGuess);

	// Keep track of how long the cost has been "stuck".
	var convergentFamily = {
		size: 0,
		max: currentScore,
		update: function (newScore) {
			if (this.max / newScore <= 1.00001) {
				this.size ++;
			} else {
				this.max = newScore;
				this.size = 1;
			}
		},
		hasConverged: () => this.size >= 30,
		hasSuperConverged: () => this.size >= 100
	};

	for (let iteration = 0; iteration < numIterations; iteration ++) {
		// Make a new guess.
		let newGuess = currentGuess.map(currentCoefficient => {
			// Multiply by something in [0.9, 1.1).
			const scale = 0.2 * Math.random() + 0.9;
			// Maybe flip between negative/positive.
			const sign = Math.random() < 0.95 ? 1 : -1;
			// Each value has a 50% chance of being scaled.
			return Math.random() < 0.5 ? scale * currentCoefficient * sign : currentCoefficient;
		});

		// Experimental: Converged? Jumpstart the guess, especially leading (lower order) coefficients beyond the original ones.
		if (convergentFamily.hasConverged()) {		
			newGuess = newGuess.map((currentCoefficient, idx) => {
				if (idx < initialPolynomialSize) {
					return currentCoefficient;
				}
				var scale = 0.2 * Math.random() + 0.9;
				var normalizedIdx = idx - initialPolynomialSize;
				var probability = (normalizedIdx + 9) / (normalizedIdx + 10);// starts at >0.9, approaches 1
				return Math.random() < probability ? scale * currentCoefficient : currentCoefficient;
			});
		}

		// Experimental: Definitely converged? Add a new coefficient.
		if (convergentFamily.hasSuperConverged()) {
			newGuess.push(Math.random() - 0.5);// Throw in something from [-0.5, 0.5)
		}

		// Step if the new guess has a lower score.
		var newScore = cost(newGuess);
		if (newScore < currentScore) {
			currentGuess = newGuess;
			currentScore = newScore;
			convergentFamily.update(newScore);

			console.log(currentGuess, currentScore, convergentFamily.size, iteration);
		}
	}

	console.log(currentGuess, currentScore);
	console.log("# iterations", numIterations);
	console.log("Guess", currentGuess);
	console.log("Guess cost", cost(currentGuess));

	// Copy-paste into desmos.com graphing calculator.
	const graphableString = currentGuess.map((c, idx) => {
		if (idx === 0) {
			return `${c}`;
		}
		const exponent = currentGuess.length - idx;
		return `${c}x^${idx}`;
	}).join(" + ");
	console.log(graphableString);

	// Worst-case, y = 0, as a sanity check.
	console.log(cost([0]));

	// Do not use the truncated Maclaurin series as a theoretical ideal. Even at 10 coefficients, it does
	// not approximate sin(x) well outside [-4, 4]. This greedy estimator will do a better job (overfitting)
	// the specified x-range, so they aren't worth comparing.
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
	var testRange = range(- 2 * Math.PI, 2 * Math.PI, 0.01);
	return testRange
		.map(x => Math.abs(reality(x) - candidate(x)))
		.reduce((sum, a) => sum + a * a, 0) / testRange.length;
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

greedyWalk({
	initialPolynomialSize: 6,
	numIterations: 1e4
});
