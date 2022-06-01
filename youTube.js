const puppeteer = require("puppeteer");
const pdfkit = require("pdfkit");
const fs = require("fs");

const url ="https://www.youtube.com/playlist?list=PLRBp0Fe2GpglTnOLbhyrHAVaWsCIEX53Y"
let cTab;

(async function () {
    try {
        let browserOpen = puppeteer.launch({
            headless: false,
            defaultViewport: null,
            args: ['--start-maximized']
        })
        
        let browserInstance = await browserOpen;
        let allTabsArr = await browserInstance.pages();
        cTab = allTabsArr[0];
        await cTab.goto(url);
        await cTab.waitForSelector('h1#title');
        let name = await cTab.evaluate(function (select) { return document.querySelector(select).innerText }, 'h1#title');
        console.log(name);
         
        let allData = await cTab.evaluate(getData, "#stats .style-scope.ytd-playlist-sidebar-primary-info-renderer");
        console.log(name, allData.noOfVideos, allData.noOfViews);

        let TotalVideos = allData.noOfVideos.split(" ")[0];
        console.log(TotalVideos);
        
        let currentVideos = await getCurrentVideosLen();
        console.log(currentVideos);

        while (TotalVideos - currentVideos >= 20) {
            await srcollToBottom();
            currentVideos =await getCurrentVideosLen();
        }

        let finalList =await getStats();
        // console.log(finalList);
        let pdf = new pdfkit;
        pdf.pipe(fs.createWriteStream('play.pdf'));
        pdf.text(JSON.stringify(finalList));
        pdf.end();
        
        
    }

    catch (error) {
        console.log(error);
    }
})()

function getData(selector) {
    let allElems = document.querySelectorAll(selector);
    let noOfVideos = allElems[0].innerText;
    let noOfViews = allElems[1].innerText;

    return {
        noOfVideos,
        noOfViews
    }
}

async function getCurrentVideosLen() {
    let length = await cTab.evaluate(getLength, "#container>#thumbnail span.style-scope.ytd-thumbnail-overlay-time-status-renderer");
    return length;
}

function getLength(durationSelect) {
    let durationElement = document.querySelectorAll(durationSelect);
    return durationElement.length;
}

async function srcollToBottom() {
    await cTab.evaluate(goToBottom);
    function goToBottom() {
        window.scrollBy(0, window.innerHeight);
    }

}

async function getStats()
{
    let list = await cTab.evaluate(getNameAndDuration, "#video-title", "#container>#thumbnail span.style-scope.ytd-thumbnail-overlay-time-status-renderer");
    return list;
}
function getNameAndDuration(videoSelector, durationSelector) {
    let viddeoElem = document.querySelectorAll(videoSelector);
    let durationElem = document.querySelectorAll(durationSelector);

    let currentList = [];
    for (let i = 0; i < durationElem.length; i++){
        let videoTitle = viddeoElem[i].innerText;
        let duration = durationElem[i].innerText;
        currentList.push({ videoTitle, duration });
    }
    return currentList;
}