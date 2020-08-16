/**
 * Greedy random-walk algorithm to approximate the leading coefficients of the Taylor series of sin(x).
 *
 * To run: node ai.js
 */

Array.prototype.sum = function() {
	return this.reduce((acc, x) => acc + x, 0);
};

function greedyWalk({initialPolynomialSize, numIterations, targetFunction, targetInterval}) {

	var currentGuess = fillArray(initialPolynomialSize, Math.random);
	var currentCost = computeCost(currentGuess, targetFunction, targetInterval);

	// Keep track of how long the cost has been "stuck".
	const convergenceTracker = {
		size: 0,
		max: currentCost,
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
		if (convergenceTracker.hasConverged()) {		
			newGuess = newGuess.map((currentCoefficient, idx) => {
				if (idx < initialPolynomialSize) {
					return currentCoefficient;
				}
				const scale = 0.2 * Math.random() + 0.9;
				const normalizedIdx = idx - initialPolynomialSize;
				const probability = (normalizedIdx + 9) / (normalizedIdx + 10);// starts at >0.9, approaches 1
				return Math.random() < probability ? scale * currentCoefficient : currentCoefficient;
			});
		}

		// Experimental: Definitely converged? Add a new coefficient.
		if (convergenceTracker.hasSuperConverged()) {
			newGuess.push(Math.random() - 0.5);// Throw in something from [-0.5, 0.5)
		}

		// Step if the new guess has a lower cost.
		const newCost = computeCost(newGuess, targetFunction, targetInterval);
		if (newCost < currentCost) {
			currentGuess = newGuess;
			currentCost = newCost;
			convergenceTracker.update(newCost);

			console.log(currentGuess, currentCost, convergenceTracker.size, iteration);
		}
	}

	// Print results.
	console.log(currentGuess, currentCost);
	console.log("Final coefficients", currentGuess);
	console.log("Final cost", computeCost(currentGuess, targetFunction, targetInterval));

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
	console.log("Worst-case cost", computeCost([0], targetFunction, targetInterval));

	// Do not use the truncated Maclaurin series as a theoretical ideal. Even at 10 coefficients, it does
	// not approximate sin(x) well outside [-4, 4]. This greedy estimator will do a better job (overfitting)
	// the specified x-range, so they aren't worth comparing.
}


/**
 * The cost/loss function to score the suggested Taylor expansion. Aim to minimize this.
 * 
 * @param array[float] coefficients: The list of coefficents.
 * @param function targetFunction: The function being approximated.
 * @return float: The score representing the sum of squares of deviations from the desired function
 */
function computeCost(coefficients, targetFunction, targetInterval) {
	var candidate = tester(coefficients);
	var reality = (x) => Math.sin(x);
	var testRange = range(targetInterval.lower, targetInterval.upper, 0.01);
	return testRange
		.map(x => Math.pow(reality(x) - candidate(x), 2))
		.sum() / testRange.length;
}

/**
 * @return array[float]: { x | x E [start,end) and (x - start) mod step = 0 }
 */
function range(start, end, step = 1) {
	var size = Math.ceil((end - start) / step);
	var vector = [...Array(size).keys()];
	return vector.map(x => x * step + start);
}

// Used by computeCost() to build the candidate polynomial function 
function tester(coefficients) {
	return function (x) {
		return coefficients
			.map((coefficient, idx) => coefficient * Math.pow(x, idx))
			.reduce((sum, a) => sum + a, 0);
	};
}

function fillArray(size, fillFunction) {
	return new Array(size).fill(null).map(() => fillFunction());
}


greedyWalk({
	initialPolynomialSize: 6,
	numIterations: 10_000,
	targetFunction: Math.sin,
	targetInterval: {
		lower: - 2 * Math.PI,
		upper: 2 * Math.PI
	}
});
