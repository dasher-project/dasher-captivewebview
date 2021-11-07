Custom Keyboard for iOS
=======================
This directory is for the proof-of-concept custom keyboard for iOS.

Notes
=====
-   The iOS project has a workspace. This means that you should in general
    **always open the workspace** DasherKeyboard.xcworkspace file, and **never
    open the project**.

    Contents of the workspace are as follows.

    -   Keyboard, the Xcode project for this proof of concept.
        -   browser, reference to the HTML, CSS, and JavaScript.
        -   ContainingApplication, required to package the keyboard.
        -   Extension, the actual custom keyboard code.
    -   CaptiveWebView, reference to the submodule.

-   Instructions for adding Captive Web View for iOS are in its repository,
    here:  
    [https://github.com/vmware/captive-web-view/tree/main/forApple](https://github.com/vmware/captive-web-view/tree/main/forApple)

    You might have to build the Captive Web View target separately before you
    can build the custom keyboard.

-   ToDo: Raise an issue on Captive Web View about the retain cycle and message
    handler.

-   ToDo: Maybe change the Captive Web View load() return value in case the
    underlying load returns a null WKNavigation.

-   Instructions for custom keyboards for iOS can be found on the Apple
    developer website.

    -   Current instructions are here, for example:  
        [https://developer.apple.com/documentation/uikit/keyboards_and_input/creating_a_custom_keyboard](https://developer.apple.com/documentation/uikit/keyboards_and_input/creating_a_custom_keyboard)

    -   Archived instructions are here, for example:  
        [https://developer.apple.com/library/archive/documentation/General/Conceptual/ExtensibilityPG/CustomKeyboard.html#//apple_ref/doc/uid/TP40014214-CH16-SW1](https://developer.apple.com/library/archive/documentation/General/Conceptual/ExtensibilityPG/CustomKeyboard.html#//apple_ref/doc/uid/TP40014214-CH16-SW1)

-   Custom keyboards can't be used to enter passwords, nor phone numbers.

    See this page:  
    [https://developer.apple.com/documentation/uikit/keyboards_and_input/creating_a_custom_keyboard/configuring_a_custom_keyboard_interface](https://developer.apple.com/documentation/uikit/keyboards_and_input/creating_a_custom_keyboard/configuring_a_custom_keyboard_interface)

    Under the Support Different Input Types heading, it says:

    >   Some text input views don’t allow custom keyboards:
    >
    >   -   Secure text field entries always show the system keyboard when the
    >       user begins entering text in a secure text field, temporarily
    >       removing your custom keyboard if it’s active. The system shows your
    >       keyboard again when the user begins entering text into a non-secure
    >       text field.
    >
    >   -   Text input fields configured with a keyboard type of
    >       UIKeyboardType.phonePad or UIKeyboardType.namePhonePad show the
    >       system keyboard.

-   Developers have complained about lack of support for custom keyboards in the
    past.

    -   http://archagon.net/blog/2014/11/08/the-trials-and-tribulations-of-writing-a-3rd-party-ios-keyboard/

    -   https://developer.apple.com/forums/thread/45121

    The points about which they are complaining still apply.

-   It seems like the Xcode debugger always crashes a second or two after the
    custom keyboard opens. If the keyboard is re-opened then it runs OK but you
    can't, for example, get any logging output in the Xcode console.

    Another way to side-load is to run the containing application.

License
=======
Copyright (c) 2021 The ACE Centre-North, UK registered charity 1089313.  
MIT licensed, see
[https://opensource.org/licenses/MIT](https://opensource.org/licenses/MIT).
