//
//  Predictor.swift
//
// (c) 2022 The ACE Centre-North, UK registered charity 1089313.
// MIT licensed, see https://opensource.org/licenses/MIT
//

import UIKit

class Predictor {
    private static let textChecker = UITextChecker()
    
    // Handy place to stick in a breakpoint and try out the UITextChecker.
    // Put the breakpoint on the return statement.
    static func tests() {
        let results = [
            Predictor.predictions(for: "C"),
            Predictor.predictions(for: "Ce"),
            Predictor.predictions(for: "ce"),
            Predictor.predictions(for: ""),         // nil
            Predictor.predictions(for: "a b"),      // empty
            Predictor.predictions(for: "I like "),  // empty
            Predictor.predictions(for: "."),        // empty
            Predictor.predictions(for: "1"),
            Predictor.predictions(for: "a"),
            Predictor.predictions(for: "e-ma"),
            Predictor.predictions(for: "*"), // empty
            Predictor.complete("*"),         // nil
            Predictor.complete(" *"),        // nil
            Predictor.complete("Your *"),    // nil
            Predictor.complete("You are a", 1), // 20 sensible values
            Predictor.complete("You are a", 2), // empty
            Predictor.complete("You are ", 0), // nil
            Predictor.complete("You are ", 1), // empty
            Predictor.complete("You are *", 1), // empty
            Predictor.complete("Have no\nme", 5), // empty, includes space.
            Predictor.complete("I will\nmak", 2), // 6 values starting a k.
            Predictor.complete("You are *"), // 20 weird values
            Predictor.complete("I like *")   // same 20 weird values
            , Predictor.completeLastWord(of: "Hi ther").replacements
            , Predictor.completeLastWord(of: "Hi  ther").replacements
            , Predictor.completeLastWord(of: "Hi\nthe").replacements
        ]

        return
    }
    
    /// Generates a series of word predictions for the given incomplete word.
    /// Reference: https://nshipster.com/uitextchecker/
    /// - Parameter input: An incomplete word.
    static func predictions(for input: String) -> [String]? {
        let returning = textChecker.completions(
            forPartialWordRange: NSRange(0..<input.utf16.count),
            in: input,
            language: "en_US"
        )
        return returning
    }
    
    static private func complete(_ input: String) -> [String]? {
        // Based on code posted lower down this thread:
        // https://forums.developer.apple.com/thread/47354
        let range = NSMakeRange(input.utf16.count, -1)
            
        // Next line generates an error message like this.
        // Dasher v6[10345:651947] *** -[__NSCFString substringWithRange:]: Range {9, 18446744073709551615} out of bounds; string length 9. This will become an exception for apps linked after 10.10 and iOS 8. Warning shown once per app execution.

        let returning = textChecker.completions(
            forPartialWordRange: range,
            in: input,
            language: "en_US"
        )
        return returning
    }

    static private func complete(_ sentence: String, _ from:UInt) -> [String]? {
        let range = NSMakeRange(sentence.utf16.count - Int(from), Int(from))
        let returning = textChecker.completions(
            forPartialWordRange: range,
            in: sentence,
            language: "en_US"
        )
        return returning
    }

    static func completeLastWord(
        of input: String //, in language:String?
    ) -> (replacedLength:Int, replacements:[String]?)
    {
        // This seems a pretty expensive way to get the last non-space index
        // from the input string but it's the only thing Jim could find that was
        // remotely sensible.
        let lastWordLength = input.components(
            separatedBy:CharacterSet.whitespacesAndNewlines
        ).last?.count ?? input.count
        // The ?? operator makes the length be the whole input if no space is
        // found.
        
        let range = NSMakeRange(input.count - lastWordLength, lastWordLength)
            
        let returning = textChecker.completions(
            forPartialWordRange: range,
            in: input,
            language: "en_US"
        )
        return (lastWordLength, returning)
    }
    
    struct Command {
        static let name = "predict"
        struct Args {
            static let input = "input"
        }
        struct Ret {
            static let replacements = "replacements"
            static let replacedLength = "replacedLength"
        }
    }
    
    /// Handle the 'predict' command.
    /// - Parameter command: Command dictionary.
    static func response(
        to command: Dictionary<String, Any>
    ) throws -> Dictionary<String, Any>
    {
        guard let input = command[Command.Args.input] as? String else {
            throw ErrorMessage.message(
                "Missing `\(Command.Args.input)` parameter in \(command).")
        }
        
        let result = Predictor.completeLastWord(of: input)

        return [
            Command.Ret.replacements: result.replacements ?? [],
            Command.Ret.replacedLength: result.replacedLength
        ]
    }

}

// See note in DefaultViewController.swift file, in the Captive Web View project
// for a discussion of why this is here.
private enum ErrorMessage: Error {
    case message(_ message:String)
}
