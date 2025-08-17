function drawKeyboard () {
    top = screen.height - BOTTOM_BAR_HEIGHT - keyboardRows * CELL_HEIGHT - PADDING
    left = (screen.width >> 1) - ((CELL_WIDTH * keyboardColumns) >> 1)
    for (let j = 0; j <= keyboardRows * keyboardColumns - 1; j++) {
        col3 = j % keyboardColumns
        row3 = Math.idiv(j, keyboardColumns)
        if (col3 == cursorColumn && row3 == cursorRow) {
            screen.fillRect(left + col3 * CELL_WIDTH, top + row3 * CELL_HEIGHT, CELL_WIDTH, CELL_HEIGHT, 0)
        }
        screen.print(
            getSymbolForIndex(j),
            left + col3 * CELL_WIDTH + LETTER_OFFSET_X,
            top + row3 * CELL_HEIGHT + LETTER_OFFSET_Y,
            theme.colorAlphabet
        )
    }
}
function confirm () {
    if (cursorRow == 3) {
        if (cursorColumn % 2) {
            confirmPressed = true
        } else {
            upper = !(upper)
        }
    } else {
        if (selectionStart >= answerLength) {
            return
        }
        index = cursorColumn + cursorRow * keyboardColumns
        letter = getCharForIndex(index, upper)
        if (!(result)) {
            result = letter
        } else {
            result = "" + result + letter
        }
        changeTime = game.runtime()
        changeInputIndex(1)
    }
}
function createRenderable () {
    if (renderable) {
        renderable.destroy();
    }
    const promptText = new sprites.RenderText(message, CONTENT_WIDTH);
let systemKeyboardText: sprites.RenderText;
renderable = scene.createRenderable(-1, () => {
        promptText.draw(screen, (screen.width >> 1) - (promptText.width >> 1), CONTENT_TOP, theme.colorPrompt, 0, 2)
        drawInputArea();

        if (!useSystemKeyboard) {
            drawKeyboard();
            drawBottomBar();
            return;
        }

        if (!systemKeyboardText) {
            systemKeyboardText = new sprites.RenderText(helpers._getLocalizedInstructions(), CONTENT_WIDTH);
        }

        screen.fillRect(0, screen.height - (PADDING << 1) - systemKeyboardText.height, screen.width, screen.height, theme.colorBottomBackground);
        systemKeyboardText.draw(screen, PADDING, screen.height - PADDING - systemKeyboardText.height, theme.colorBottomText);
    });
}
function drawBottomBar () {
    drawBottomBarBackground()
    drawShift(cursorRow == 3 && !(cursorColumn & 1))
    drawConfirm(cursorRow == 3 && !(!(cursorColumn & 1)))
}
function changeInputIndex (delta: number) {
    selectionStart += delta
    selectionEnd = selectionStart
}
function drawBottomBarBackground () {
    screen.fillRect(0, screen.height - BOTTOM_BAR_HEIGHT, screen.width, BOTTOM_BAR_HEIGHT, 0)
}
function blink () {
    return Math.idiv(game.runtime() - changeTime, 500) & 1
}
function drawInputArea () {
    answerLeft = ROW_LEFT + Math.floor((CELL_WIDTH * ALPHABET_ROW_LENGTH - CELL_WIDTH * Math.min(answerLength, ALPHABET_ROW_LENGTH)) / 2)
    for (let i = 0; i <= answerLength - 1; i++) {
        col = i % ALPHABET_ROW_LENGTH
        row = Math.floor(i / ALPHABET_ROW_LENGTH)
        if (selectionStart != selectionEnd && i >= selectionStart && i < selectionEnd) {
            screen.fillRect(answerLeft + col * CELL_WIDTH, INPUT_TOP + row * CELL_HEIGHT, CELL_WIDTH, CELL_HEIGHT, 0)
        }
        screen.fillRect(answerLeft + col * CELL_WIDTH + BLANK_PADDING, INPUT_TOP + row * CELL_HEIGHT + CELL_HEIGHT - 1, CELL_WIDTH - BLANK_PADDING * 2, 1, !useSystemKeyboard && !blink() && i === selectionStart ? theme.colorInputHighlighted : theme.colorInput)
        if (i < result.length) {
            char = result.charAt(i)
            screen.print(
                char,
                answerLeft + col * CELL_WIDTH + LETTER_OFFSET_X,
                INPUT_TOP + row * CELL_HEIGHT + LETTER_OFFSET_Y,
                theme.colorInputText,
                font
            );
        }
    }
    // draw the blinking text cursor
    if (useSystemKeyboard) {
        if (selectionStart == selectionEnd && selectionStart < answerLength) {
            col2 = selectionStart % ALPHABET_ROW_LENGTH
            row2 = Math.floor(selectionStart / ALPHABET_ROW_LENGTH)
            if (!(blink())) {
                screen.fillRect(answerLeft + col2 * CELL_WIDTH, INPUT_TOP + row2 * CELL_HEIGHT, 1, CELL_HEIGHT, 0)
            }
        }
    }
}
function drawConfirm (highlighted: boolean) {
    if (highlighted) {
        screen.fillRect(CONFIRM_BUTTON_LEFT, screen.height - BOTTOM_BAR_HEIGHT, BOTTOM_BAR_BUTTON_WIDTH, BOTTOM_BAR_HEIGHT, 0)
    }
    screen.print(
        confirmText,
        CONFIRM_BUTTON_LEFT + BOTTOM_BAR_CONFIRM_X,
        screen.height - BOTTOM_BAR_HEIGHT + BOTTOM_BAR_TEXT_Y,
        theme.colorBottomText
    )
}
function drawShift (highlighted: boolean) {
    if (highlighted) {
        screen.fillRect(0, screen.height - BOTTOM_BAR_HEIGHT, BOTTOM_BAR_BUTTON_WIDTH, BOTTOM_BAR_HEIGHT, 0)
    }
    shiftText = lowerShiftText
    if (upper) {
        shiftText = upperShiftText
    }
    screen.print(
        shiftText,
        BOTTOM_BAR_SHIFT_X,
        screen.height - BOTTOM_BAR_HEIGHT + BOTTOM_BAR_TEXT_Y,
        theme.colorBottomText
    )
}
function moveHorizontal (right: boolean) {
    if (right) {
        cursorColumn = (cursorColumn + 1) % keyboardColumns
    } else {
        cursorColumn = (cursorColumn + (keyboardColumns - 1)) % keyboardColumns
    }
}
function numbersOnly () {
    return false
}
function show (message: string, answerLength: number, useOnScreenKeyboard: boolean) {
    message = message
    answerLength = answerLength
    controller._setUserEventsEnabled(false);
game.pushScene()
createRenderable()
    confirmPressed = false
    if (!(useOnScreenKeyboard) && control.deviceDalVersion() == "sim" && helpers._isSystemKeyboardSupported()) {
        useSystemKeyboard = true
        helpers._promptForText(answerLength, numbersOnly())
        selectionEnd = 0
        selectionStart = 0
        control.onEvent(_KEYBOARD_CHANGE_EVENT, 0, () => {
            result = helpers._getTextPromptString().substr(0, answerLength);

            changeTime = game.runtime();

            selectionStart = helpers._getTextPromptSelectionStart();
            selectionEnd = helpers._getTextPromptSelectionEnd();
        })
control.onEvent(_KEYBOARD_CANCEL_EVENT, 0, () => {
            cancelled = true;
        });
control.onEvent(_KEYBOARD_ENTER_EVENT, 0, () => {
            finished = true;
        });
pauseUntil(() => cancelled || finished)
        if (cancelled) {
            useSystemKeyboard = false
            selectionStart = result.length
            selectionEnd = selectionStart
            registerHandlers()
            pauseUntil(() => confirmPressed)
        }
    } else {
        useSystemKeyboard = false
        registerHandlers()
        pauseUntil(() => confirmPressed)
    }
    game.popScene();
controller._setUserEventsEnabled(true);
return result
}
function registerHandlers () {
    controller.up.onEvent(SYSTEM_KEY_DOWN, () => {
        moveVertical(true);
    })
controller.down.onEvent(SYSTEM_KEY_DOWN, () => {
        moveVertical(false);
    })
controller.right.onEvent(SYSTEM_KEY_DOWN, () => {
        moveHorizontal(true);
    });
controller.left.onEvent(SYSTEM_KEY_DOWN, () => {
        moveHorizontal(false);
    });
controller.A.onEvent(SYSTEM_KEY_DOWN, () => {
        confirm();
    });
controller.B.onEvent(SYSTEM_KEY_DOWN, () => {
        delete2();
    });
}
function delete2 () {
    if (selectionStart <= 0) {
        return
    }
    result = result.substr(0, result.length - 1)
    changeInputIndex(-1)
}
function getCharForIndex (index: number, upper: boolean) {
    if (index < 26) {
        return String.fromCharCode(index + (upper ? 65 : 97))
    } else {
        if (upper) {
            return digitsUpper[index - 26]
        } else {
            return "" + (index - 26)
        }
    }
}
function moveVertical (up: boolean) {
    if (up) {
        if (cursorRow == keyboardRows) {
            cursorRow = keyboardRows - 1
            if (cursorColumn % 2) {
                cursorColumn = keyboardColumns - 1
            } else {
                cursorColumn = 0
            }
        } else {
            cursorRow = Math.max(0, cursorRow - 1)
        }
    } else {
        cursorRow = Math.min(keyboardRows, cursorRow + 1)
        if (cursorRow == keyboardRows) {
            cursorColumn = cursorColumn > 5 ? 1 : 0;
        }
    }
}
function getSymbolForIndex (index: number) {
    return getCharForIndex(index, upper)
}
let row2 = 0
let col2 = 0
let letter = ""
let index = 0
let confirmPressed = false
let BOTTOM_BAR_BUTTON_WIDTH = 0
let ROW_LEFT = 0
let BLANK_PADDING = 0
let digitsUpper: string[] = []
let upperShiftText = ""
let lowerShiftText = ""
let shiftText = ""
let char = ""
let row = 0
let col = 0
let answerLeft = 0
let row3 = 0
let col3 = 0
let left = 0
let top = 0
let INPUT_TOP = 0
let CONFIRM_BUTTON_LEFT = 0
let BOTTOM_BAR_HEIGHT = 0
let CELL_HEIGHT = 0
let CELL_WIDTH = 0
let ALPHABET_ROW_LENGTH = 0
let PADDING = 0
let changeTime = 0
let message: string = ""
let result: string = ""
let cursorRow: number = 0
let cursorColumn: number = 0
let upper: boolean = false
let useSystemKeyboard: boolean = false
let selectionStart: number = 0
let selectionEnd: number = 0
let keyboardRows: number = 0
let keyboardColumns: number = 0
let answerLength = 0
let finished = false
let cancelled = false
// % whenUsed=true
lowerShiftText = "ABC"
// % whenUsed=true
upperShiftText = "abc"
// % whenUsed=true
digitsUpper = [
" ",
",",
".",
"?",
"!",
":",
";",
"\"",
"(",
")"
]
// % whenUsed=true
let confirmText = "OK"
const font = image.font8;
// % whenUsed=true
PADDING = 4
// % whenUsed=true
let NUM_LETTERS = 26
// % whenUsed=true
ALPHABET_ROW_LENGTH = 12
// % whenUsed=true
let NUM_ROWS = Math.ceil(NUM_LETTERS / ALPHABET_ROW_LENGTH)
// % whenUsed=true
let INPUT_ROWS = 2
// % whenUsed=true
let CONTENT_WIDTH = screen.width - PADDING * 2
// % whenUsed=true
let CONTENT_HEIGHT = screen.height - PADDING * 2
// % whenUsed=true
let CONTENT_TOP = PADDING
// Dimensions of a "cell" that contains a letter
// % whenUsed=true
CELL_WIDTH = Math.floor(CONTENT_WIDTH / ALPHABET_ROW_LENGTH)
// % whenUsed=true
CELL_HEIGHT = CELL_WIDTH
// % whenUsed=true
let LETTER_OFFSET_X = Math.floor((CELL_WIDTH - font.charWidth) / 2)
// % whenUsed=true
let LETTER_OFFSET_Y = Math.floor((CELL_HEIGHT - font.charHeight) / 2)
// % whenUsed=true
BLANK_PADDING = 1
// % whenUsed=true
ROW_LEFT = PADDING + Math.floor((CONTENT_WIDTH - CELL_WIDTH * ALPHABET_ROW_LENGTH) / 2)
// Dimensions of the bottom bar
// % whenUsed=true
let BOTTOM_BAR_ALPHABET_MARGIN = 4
// % whenUsed=true
BOTTOM_BAR_HEIGHT = PADDING + BOTTOM_BAR_ALPHABET_MARGIN + CELL_HEIGHT
// % whenUsed=true
BOTTOM_BAR_BUTTON_WIDTH = PADDING * 2 + font.charWidth * 3
// % whenUsed=true
let BOTTOM_BAR_TEXT_Y = (BOTTOM_BAR_HEIGHT - font.charHeight) / 2
// % whenUsed=true
let BOTTOM_BAR_SHIFT_X = (BOTTOM_BAR_BUTTON_WIDTH - font.charWidth * 3) / 2
// % whenUsed=true
let BOTTOM_BAR_CONFIRM_X = (BOTTOM_BAR_BUTTON_WIDTH - font.charWidth * 2) / 2
// % whenUsed=true
CONFIRM_BUTTON_LEFT = screen.width - BOTTOM_BAR_BUTTON_WIDTH
// Dimensions of the alphabet area
// % whenUsed=true
let ALPHABET_HEIGHT = NUM_ROWS * CELL_HEIGHT
// % whenUsed=true
let ALPHABET_TOP = CONTENT_TOP + CONTENT_HEIGHT - ALPHABET_HEIGHT - BOTTOM_BAR_HEIGHT
// % whenUsed=true
let ALPHABET_INPUT_MARGIN = 10
// Dimensions of area where text is input
// % whenUsed=true
let INPUT_HEIGHT = INPUT_ROWS * CELL_HEIGHT
// % whenUsed=true
INPUT_TOP = ALPHABET_TOP - INPUT_HEIGHT - ALPHABET_INPUT_MARGIN
let _KEYBOARD_CHANGE_EVENT = 7339
let _KEYBOARD_ENTER_EVENT = 7340
let _KEYBOARD_CANCEL_EVENT = 7341
interface PromptTheme {
    colorPrompt: number;
    colorInput: number;
    colorInputHighlighted: number;
    colorInputText: number;
    colorAlphabet: number;
    colorCursor: number;
    colorBackground: number;
    colorBottomBackground: number;
    colorBottomText: number;
}
let theme: PromptTheme;
answerLength = 12
let renderable: scene.Renderable;
function runTime(theme: PromptTheme) {
    if (theme) {
        theme = theme;
    }
    else {
        theme = {
            colorPrompt: 1,
            colorInput: 3,
            colorInputHighlighted: 5,
            colorInputText: 1,
            colorAlphabet: 1,
            colorCursor: 7,
            colorBackground: 15,
            colorBottomBackground: 3,
            colorBottomText: 1,
        };
    }
    cursorRow = 0;
    cursorColumn = 0;
    upper = false;
    result = "";
    keyboardColumns = ALPHABET_ROW_LENGTH;
    keyboardRows = NUM_ROWS;
    selectionStart = 0;
    selectionEnd = 0;
}
