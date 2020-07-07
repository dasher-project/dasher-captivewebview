// (c) 2020 The ACE Centre-North, UK registered charity 1089313.
// Copyright 2020 Google LLC
// MIT licensed, see https://opensource.org/licenses/MIT

/*

Basic predictor based on Prediction by Partial Matching (PPM) algorithm provided
by `jslm` library.

*/

import {bufferAlice} from './third_party/gutenberg/alice.js'
import {bufferSherlockHolmes} from './third_party/gutenberg/sherlock.js'
import PPMLanguageModel from './third_party/jslm/ppm_language_model.js'
import {Vocabulary} from './third_party/jslm/vocabulary.js'

// Simple priors on the symbols are computed using text corpora files stored as
// strings under `third_party/gutenberg` directory.
const trainingText = bufferAlice + bufferSherlockHolmes;

// Computes vocabulary from the supplied palette and the short training text
// above. Also precompute some helper dictionaries so that we don't have to
// convert between codepoints and vocabulary IDs back and forth.
let vocab = null;
let codepointToVocabId = {};

function initVocabulary(palette) {
    console.log("Initializing vocabulary ...");
    vocab = new Vocabulary();
    let paletteCodePoints = palette.codePoints;
    for (let i = 0; i < trainingText.length; ++i) {
	const codepoint = trainingText.codePointAt(i);
	if (paletteCodePoints.includes(codepoint)) {
	    const symbol = codepoint.toString();
	    const vocab_id = vocab.addSymbol(symbol);
	    if (!(codepoint in codepointToVocabId)) {
		codepointToVocabId[codepoint] = vocab_id;
	    }
	}
    }
    for (let i = 0; i < paletteCodePoints.length; ++i) {
	const codepoint = paletteCodePoints[i];
	const symbol = codepoint.toString();
	const vocab_id = vocab.addSymbol(symbol);
	if (!(codepoint in codepointToVocabId)) {
	    codepointToVocabId[codepoint] = vocab_id;
	}
    }
    console.log("Added " + vocab.size() + " symbols.");
    return vocab;
}

//
// Boostraps PPM model using training text.
//

let model = null;
const modelMaxOrder = 5;  // History length.

function bootstrapModel(vocab) {
    console.log("Initializing LM ...");
    model = new PPMLanguageModel(vocab, modelMaxOrder);
    let context = model.createContext();
    let numSymbols = 0;
    for (let i = 0; i < trainingText.length; ++i) {
	if (trainingText[i] == "\n") {
	    continue;  // Ignore newlines.
	}
	const symbol = trainingText.codePointAt(i).toString();
	model.addSymbolAndUpdate(context, vocab.symbols_.indexOf(symbol));
	numSymbols++;
    }
    console.log("Processed " + numSymbols + " symbols.");
    return model;
}

// Returns top-N (`top_n`) candidate symbols given the probabilities (`probs`).
// This is debugging API.
function topCandidates(probs, top_n) {
    probs[0] = -1000.0;  // Ignore first element.
    let probsAndPos = probs.map(function(prob, index) {
	return { index: index, prob: prob };
    });
    probsAndPos.sort(function(a, b) {
	// Note: By default the sort function will treat elements as strings.
	// Following will explicitly treat them as floating point numbers.
	return b.prob - a.prob;
    });
    let cands = [];
    for (let i = 0; i < top_n; ++i) {
	const bestIndex = probsAndPos[i].index;
	const bestProb = probsAndPos[i].prob;
	const symbol = String.fromCodePoint(Number(vocab.symbols_[bestIndex]));
	cands.push({ symbol: symbol, prob: bestProb });
    }
    return cands;
}

// Same as above, but prepares the array for fancy debug output.
function debugTopCandidates(probs, top_n) {
    const cands = topCandidates(probs, top_n);
    let debugCands = [];
    for (let i = 0; i < top_n; ++i) {
	const candBuf = "'" + cands[i].symbol + "' (" + cands[i].prob + ")";
	debugCands.push(candBuf);
    }
    return debugCands;
}

// Given a text prints its most $n$ likely continuations in generative mode.
function generateText(seedText, maxLength, topN) {
    let context = model.createContext();
    for (let i = 0; i < seedText.length; ++i) {
	const codepoint = seedText.codePointAt(i);
	const symbol = vocab.symbols_.indexOf(codepoint.toString());
	model.addSymbolToContext(context, symbol);
    }
    let text = seedText;
    for (let i = 0; i < maxLength; ++i) {
	const probs = model.getProbs(context);
	const cands = topCandidates(probs, topN);
	const randomIndex = Math.floor(Math.random() * topN);
	const bestChar = cands[randomIndex].symbol;
	text += bestChar;
	const codepointStr = bestChar.codePointAt(0).toString();
	model.addSymbolToContext(context,
				 vocab.symbols_.indexOf(codepointStr));
    }
    return text;
}

//
// Actual prediction interface:
//
// Current context specifies the context in which the prediction is to happen,
// i.e. the history.
const verbose = false;  // Set this to `false` to remove verbose logging.
const numBest = 5;  // Number of best candidates to display in verbose mode.

export default async function (
    codePoints, text, predictorData, palette, set_weight
) {
    console.log(`text: "${text}"`);

    // Check if we're called the first time.
    if (!vocab) {
	// Initialize vocabulary, the model, setup initial (empty) context and
	// compute initial probabilities. Cache this information.
	vocab = initVocabulary(palette);
	model = bootstrapModel(vocab);
	if (verbose) {
	    const randomText = generateText(
		/* seedText */"I", /* maxLength */300, /* topN */2);
	    console.log("Random text: \"" + randomText + "\"");
	}
    }

    let context = model.createContext();
    for (let i = 0; i < codePoints.length; ++i) {
	const codepoint = codePoints[i].toString();
	const symbol = vocab.symbols_.indexOf(codepoint);
	model.addSymbolToContext(context, symbol);
    }
    const currentProbs = model.getProbs(context);
    if (verbose) {
	let contextText = "";
	if (text.length > 0) {
	    contextText = text.slice(-modelMaxOrder);
	}
	console.log("[" + contextText + "]: " +
		    debugTopCandidates(currentProbs, numBest));
    }

    // Update the probabilities for the universe of symbols (as defined by vocab
    // that follow current context), e.g. provide:
    //
    //   P(c_i|c_{i-n},...,c_{i-1}), c \in C, where $n$ is the model order and
    //   C is the alphabet.
    const numVocabSymbols = currentProbs.length - 1;
    for (let i = 1; i < numVocabSymbols; ++i) {
	const codepoint = Number(vocab.symbols_[i]);
	set_weight(codepoint, currentProbs[i] * numVocabSymbols, null);
    }
}
