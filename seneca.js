// ==UserScript==
// @name         Seneca
// @namespace    https://app.senecalearning.com/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://app.senecalearning.com/**
// @icon         https://www.google.com/s2/favicons?sz=64&domain=senecalearning.com
// @grant        none
// ==/UserScript==

let copying = false

function copyTextToClipboard(text) {
    copying = true
    const oldElement = document.activeElement
  var textArea = document.createElement("textarea");
  textArea.style.position = 'fixed';
  textArea.style.top = 0;
  textArea.style.left = 0;
  textArea.style.width = '2em';
  textArea.style.height = '2em';
  textArea.style.padding = 0;
  textArea.style.border = 'none';
  textArea.style.outline = 'none';
  textArea.style.boxShadow = 'none';
  textArea.style.background = 'transparent';
  textArea.value = text;
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  try {
    var successful = document.execCommand('copy');
    var msg = successful ? 'successful' : 'unsuccessful';
    //console.log('Copying text command was ' + msg);
  } catch (err) {
    console.log('Oops, unable to copy');
  }

  document.body.removeChild(textArea);
  oldElement.focus()
  copying = false
}


window.findReact = (dom, traverseUp = 0) => {
    const key = Object.keys(dom).find(key=>{
        return key.startsWith("__reactFiber$") // react 17+
            || key.startsWith("__reactInternalInstance$"); // react <17
    });
    const domFiber = dom[key];
    if (domFiber == null) return null;

    // react <16
    if (domFiber._currentElement) {
        let compFiber = domFiber._currentElement._owner;
        for (let i = 0; i < traverseUp; i++) {
            compFiber = compFiber._currentElement._owner;
        }
        return compFiber._instance;
    }

    // react 16+
    const GetCompFiber = fiber=>{
        //return fiber._debugOwner; // this also works, but is __DEV__ only
        let parentFiber = fiber.return;
        while (typeof parentFiber.type == "string") {
            parentFiber = parentFiber.return;
        }
        return parentFiber;
    };
    let compFiber = GetCompFiber(domFiber);
    for (let i = 0; i < traverseUp; i++) {
        compFiber = GetCompFiber(compFiber);
    }
    return compFiber;
}

let clipboardInterval = null
let currentTxt = ""
function setClipboard(text) {
    console.log("SET CLIPBOARD",text)
    if (!text) console.error("No text")
    if (currentTxt === text) return
    if (clipboardInterval) clearInterval(clipboardInterval)
    clipboardInterval = setInterval(()=>{
        try {
            //navigator.clipboard.writeText(text)
            copyTextToClipboard(text)
        }
        catch {
            // Blocked due to lack of user interaction :(
            copyTextToClipboard(text)
        }
    }, 100)
}


setInterval(()=>{//
    document.querySelector("#session_startNewSession")?.click()
    Array.from(document.querySelectorAll(".SessionControlBar_wrapper__2XLzu .PrimaryButton_primaryButton__14UD2")).filter(e=>e.innerText==="Continue"||e.innerText==="Flip"||e.innerText==="Next"||e.innerText==="Skip"||e.innerText==="Continue assignment")[0]?.click()

    // Click through annoying modals
    const modal = document.querySelector('[data-test=Modal]')
    if (modal) {
        const buttons = Array.from(modal.querySelectorAll(".gwVOVW"))
        const matches = buttons.map(e=>e.innerText.strip().toLowerCase()).filter(text=>text in ["ask later"])
    }

    document.querySelector(".Flashcard__difficultyButton.PrimaryButtonTypes_positive__1EjAW")?.click()

    document.querySelectorAll(":not(.List__value, Mindmap__map) .BlurredWord__word--blurred").forEach(e=>{
        const react = findReact(e)
        e.innerText = react.memoizedProps.word
    })
    document.querySelectorAll(".MultipleChoiceButton_button__1qyXJ, .EquationColorMatchButton_container__20P5p").forEach((e)=>{
        const isCorrect = findReact(e).memoizedProps.correct
        if (isCorrect) e.click()
    })

    document.querySelectorAll(".Mindmap__label--hidden .BlurredWord__word").forEach(e=>{
        setClipboard(e.innerText)
    })
}, 100)

document.getElementById("root").addEventListener("focus", ({target})=>{
    if (copying) return
    const e = document.activeElement

    document.querySelectorAll(":not(.List__value, Mindmap__map) .BlurredWord__word--blurred").forEach(e=>{
        const react = findReact(e)
        e.innerText = react.memoizedProps.word
    })

    if (e.matches(":not(.Mindmap__container) > .Input_input__3CI_c")) {
        const ans = e.parentElement.parentElement.querySelector("[data-notranslate]").innerText
        setClipboard(ans)
    }

    const blurredTxt = document.querySelector(":not(.Mindmap__label) > * > .BlurredWord__word--blurred")?.innerText
    if (blurredTxt) setClipboard(blurredTxt)

    if (e.matches(":not(.Mindmap__container) > .List__WordInput__input")) {
        const alreadyPasted = Array.from(document.querySelectorAll(".ExactList_userAnswerCorrect__Gshp3")).map(e=>e.innerText)
        const answers = findReact(e.parentElement.parentElement.parentElement).memoizedProps.content?.values//[i].value[0]
        let done = false
        answers.forEach(answerItem => {
            const ans = answerItem.value[0]
            if (!ans) return
            if (ans in alreadyPasted) return
            setClipboard(ans.word || ans.otherPermittedWords[0])
            done = true
        })

    }


}, true)
