// (c) 2021 The ACE Centre-North, UK registered charity 1089313.
// MIT licensed, see https://opensource.org/licenses/MIT

/*
Predictor subclass that can be interfaced with the native UITextChecker via a
bridge to Captive Web View for iOS.

This file was part of the mass import from the original Dasher Version Six
repository. The mass import is how the Dasher Captive Web View repository was
created. By mistake, this file was git rm'd instead of being git mv'd to its
current location. That was fixed by copying the file, but that lost the history. The history was only two commits. In case you want to see them, the original imported location is like this:  
https://github.com/dasher-project/dasher-captivewebview/blob/main/browser/dasher/predictor_completions.js

*/

const codePointSpace = " ".codePointAt(0);

import predictor_basic from './dasher-web/browser/dasher/predictor.js';

export default class PredictorCompletions {

     constructor(bridge_send) {
         this._bridge_send = bridge_send;
     }

    async get_character_weights(
        codePoints, text, predictorData, palette, set_weight
    ) {

        let response = await this._bridge_send({
            "command": "predict", "input" : text === undefined ? "" : text
        });

        // Following is nice if you want to see what the native predictor
        // returned, in the JS console.
        // console.log(text, response);

        if (
            response.replacements === undefined ||
            response.replacements.length <= 0
        ) {
            // No suggested replacements, fall back to the basic predictor.
            return predictor_basic(
                codePoints, text, predictorData, palette, set_weight);
        }

        // In the response:
        //
        // -   `replacedLength` is the number of characters at the end of the
        //     input that were parsed as a word that could be incomplete.
        // -   `replacements` is an array of possible replacements in order of
        //     likelihood with the most likely first.

        const suffix = response.replacedLength;

        // Next set of variables should be changed to user preferences so that
        // they can be tuned.
        //
        // Weight to be assigned to the most likely replacement.
        const mostWeight = 15;
        //
        // Subsequent replacements will have their weight decremented. This is
        // zero now because the decrementing seems like it wouldn't add much.
        const weightDecrement = 0;
        //
        // Only the `heed` most likely replacements are considered.
        const heed = 5;

        // Previously used for returning predicted weights. Now used to prevent
        // calling set_weight twice for the same point, and for a diagnostic
        // log.
        const weights = new Map();
        let weight = mostWeight;
        for (const [index, replacement] of response.replacements.entries()) {
            if (index >= heed) {
                break;
            }

            // If this replacement is shorter than the replaced length it means
            // the message could have been a whole word.
            const point = (
                replacement.length <= suffix ?
                codePointSpace :
                replacement.codePointAt(suffix)
            );
            const weighting = weights.get(point);
            if (weighting === undefined) {
                set_weight(point, weight)
                weights.set(point, weight);
            }
            weight -= weightDecrement;
            if (weight <= 0) {
                console.log("Weight exhausted", points, text, prediction);
                break;
            }
        }

        // Following is nice if you want to see the weights Map, in the JS
        // console.
        // console.log(weights);

        return;
    }

}
