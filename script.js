navigator.serviceWorker.register('service-worker.js');

const startButton = document.querySelector("#start")
const resetButton = document.querySelector("#reset")
const backButton = document.querySelector("#back")
const amountInput = document.querySelector("#amount")
const acidityInput = document.querySelector("#acidity")
const strengthInput = document.querySelector("#strength")
const timerDisplay = document.querySelector("#timerDisplay")
const messageDisplay = document.querySelector("#messageDisplay")
const pourAmountDisplay = document.querySelector("#pourAmountDisplay")
const remainingPoursDisplay = document.querySelector("#remainingPoursDisplay")
const containerinput = document.querySelector("#container-input")
const containertimer = document.querySelector("#container-timer")

let prepareTimer
let pourTimer
let pourAmounts = []
let pourTime = 45
let prepareTime = 5
let currentTime = 0
let currentMessage = ""

function setClockDisplay() {
    timerDisplay.innerHTML = String(currentTime)
}

function setMessageDisplay(message) {
    messageDisplay.innerHTML = message
}

function setPourAmountDisplay(message) {
    pourAmountDisplay.innerHTML = message
}

function setRemainingPoursDisplay(message) {
    remainingPoursDisplay.innerHTML = message
}

function toggleContainerInput(isDisplay) {
    if (isDisplay) {
        containerinput.style.display = 'flex'
    } else {
        containerinput.style.display = 'none'
    }
}

function toggleContainerTimer(isDisplay) {
    if (isDisplay) {
        containertimer.style.display = 'flex'
    } else {
        containertimer.style.display = 'none'
    }
}

function showContainerInput() {
    toggleContainerInput(true)
    toggleContainerTimer(false)
}

function showContainerTimer() {
    toggleContainerInput(false)
    toggleContainerTimer(true)
}

function calculateValues() {
    // get data from inputs
    let coffeeAmount = amountInput.value;
    let coffeeAcidity = acidityInput.value;
    let coffeeStrength = strengthInput.value;

    let waterAmount = coffeeAmount * 15;

    let acidityWater = waterAmount * (2/5)
    let strengthWater = waterAmount * (3/5)

    console.log(acidityWater)
    console.log(strengthWater)

    pourAmounts.push(acidityWater * (coffeeAcidity/6))
    pourAmounts.push(acidityWater * ((6-coffeeAcidity)/6))
    let strengthWaterPourAmount = strengthWater / coffeeStrength
    for (let i = 0; i < coffeeStrength; i++) {
        pourAmounts.push(strengthWaterPourAmount)
    }
    console.log(pourAmounts)
}

async function startSecondTimer(isFinalPour) {
    setMessageDisplay("Pour")
    return new Promise((resolve) => {
        currentTime = 0
        let start = Date.now();
        pourTimer = setInterval(() => {
            let delta = Date.now() - start;
            currentTime = pourTime - Math.floor(delta/1000)
            if (currentTime <= 5) {
                setMessageDisplay(isFinalPour ? "Almost there!" : "Prepare for next pour")
            }
            if (currentTime < 0) {
                currentTime = 0
                // time's up
                clearInterval(pourTimer)
                resolve('pourTimer done')
            }
            setClockDisplay()
        }, 100)
    })
    
}

async function startPrepareTimer() {
    setMessageDisplay("Ready")
    return new Promise((resolve) => {
        currentTime = 0
        let start = Date.now();
        prepareTimer = setInterval(async function runTimer() {
            let delta = Date.now() - start;
            currentTime = prepareTime - Math.floor(delta/1000)
            if (currentTime < 0) {
                currentTime = 0
                // time's up
                clearInterval(prepareTimer)
                resolve("prepareTimer done")
            }
            setClockDisplay()
        }, 100)
    })
}

async function startTimer() {
    for (let i = 0; i < pourAmounts.length; i++) {
        setPourAmountDisplay(pourAmounts[i] + " mL")
        setRemainingPoursDisplay("Remaining pours: " + (pourAmounts.length - i))
        if (i == 0) {
            await startPrepareTimer()
        } 
        if (i == pourAmounts.length - 1) {
            setRemainingPoursDisplay("Remaining pours: " + (pourAmounts.length - i - 1))
            await startSecondTimer(true)
            setMessageDisplay("Done!")
        } else {
            setRemainingPoursDisplay("Remaining pours: " + (pourAmounts.length - i - 1))
            await startSecondTimer(false)
        }
    }
    pourAmounts = []
}

function stopTimer() {
    clearInterval(prepareTimer)
    clearInterval(pourTimer)
}

startButton.addEventListener('click', (event) => {
    calculateValues()
    showContainerTimer()
    startTimer()
})

resetButton.addEventListener('click', (event) => {
    stopTimer()
    startTimer()
})

backButton.addEventListener('click', (event) => {
    stopTimer()
    showContainerInput()
    currentTime = 0
    pourAmounts = []
    setClockDisplay()
    setMessageDisplay("")
    setPourAmountDisplay("")
    setRemainingPoursDisplay("")
})