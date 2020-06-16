// (c) 2020 The ACE Centre-North, UK registered charity 1089313.
// Copyright 2020 Google LLC
// MIT licensed, see https://opensource.org/licenses/MIT

/*

Basic predictor based on Prediction by Partial Matching (PPM) algorithm provided
by `jslm` library.

*/

import PPMLanguageModel from './third_party/jslm/ppm_language_model.js'
import {Vocabulary} from './third_party/jslm/vocabulary.js'

//
// Simple priors on the symbols are computed using a very short training text
// assembled from Enron Mobile dataset.
//
const trainingText = `
Have a good evening. Are you going to join us for lunch?
OK to make changes, change out original. This looks fine. See you next week.
Thanks I needed that today! I'm looking forward to the long weekend! I like it.
Nice weather for it. Hi. How is it going? I better go. Hope all is well.
Best of luck and stay in touch. Just got this. Things are OK. Are you there?
Please coordinate with him. I think I'm OK. Nothing from Mom. I'm still here.
See you soon. See you later. Will you come get me? I am on my way. hi rob.
I'm going to sleep. Still waiting on decision. Are you sure? I am all over it.
Will follow up today. Nothing but good news everyday. please call. agreed.
i want to thank everyone involved. Hey, how are you doing? Sorry about that!
Can you help me here? Can we meet? Are you feeling better? i am trying again.
I will be back Friday. and how would i be going for work. sounds good to me
and how would i be going for work? i have a favor to ask. best of luck and
stay in touch. yes I am here actually. love got it I better go. I'll confirm
nine three six five nine seven three nine zero five two one for your information
I'm fine. will call later to explain. today has been hard for me
`;

// Computes vocabulary from the supplied palette and the short training text
// above.
let vocab = null

function initVocabulary(palette) {
    console.log("Initializing vocabulary ...")
    vocab = new Vocabulary()
    for (let i = 0; i < trainingText.length; ++i) {
	const symbol = trainingText.codePointAt(i).toString();
	vocab.addSymbol(symbol);
    }
    let codePoints = palette.codePoints;
    for (let i = 0; i < codePoints.length; ++i) {
	const symbol = codePoints[i].toString();
	vocab.addSymbol(symbol);
    }
    return vocab
}

//
// Boostraps PPM model using training text.
//

let model = null
const maxOrder = 4;  // History length.

function bootstrapModel(vocab) {
    console.log("Initializing LM ...")
    model = new PPMLanguageModel(vocab, maxOrder);
    let context = model.createContext()
    for (let i = 0; i < trainingText.length; ++i) {
	const symbol = trainingText.codePointAt(i).toString();
	model.addSymbolAndUpdate(context, vocab.symbols_.indexOf(symbol));
    }
    return model;
}

//
// Actual prediction interface:
//
// Current context specifies the context in which the prediction is to happen,
// i.e. the history.
let currentContext = null;
let predictorContext = null;
let currentProbs = null;

export default async function (
    codePoints, text, predictorData, palette, set_weight
) {
    // Check if we're called the first time.
    if (!vocab) {
	// Initialize vocabulary, the model, setup initial (empty) context and
	// compute initial probabilities.
	vocab = initVocabulary(palette);
	model = bootstrapModel(vocab);
	currentContext = model.createContext();
	predictorContext = { "need_update": true, "context": currentContext };
	currentProbs = model.getProbs(currentContext)
    }

    // Look at the history to check whether we need to update the context.
    let lastCodepoint = -1;
    if (codePoints.length > 0) {
	// A symbol has been selected. Check whether the context needs to be
	// updated.
	lastCodepoint = codePoints[codePoints.length - 1]
	if (lastCodepoint > 0 && predictorContext["need_update"]) {
	    const symbol = lastCodepoint.toString();
	    model.addSymbolAndUpdate(predictorContext["context"],
				     vocab.symbols_.indexOf(symbol));
	    predictorContext["need_update"] = false;
	}
    }
    if (predictorData !== undefined) {
        console.log(`dummy "${text}" ${predictorData}`);
    }

    // Update the probabilities for the universe of symbols (as defined by vocab
    // that follow current context).
    const numVocabSymbols = currentProbs.length - 1;
    for (let i = 1; i < numVocabSymbols; ++i) {
	const codepoint = Number(vocab.symbols_[i])
	set_weight(codepoint, currentProbs[i] * numVocabSymbols,
		   predictorContext);
    }
    return;
}
