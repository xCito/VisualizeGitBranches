
// Side panel event handlers
function closeSidePanel() {
    let p = document.getElementsByClassName('side-panel')[0];
    p.style.width = "0px";
}
function openSidePanel() {
    let p = document.getElementsByClassName('side-panel')[0];
    p.style.width = "400px"
}
setTimeout(() => {
    closeSidePanel();
}, 3000);


// Canvas controls event handlers
function zoomSliderChange(event) {
    let scale = event.target.value / 10;
    canvasControl.setZoomScaler(scale);
}

function updateSliderOnUI( value ) {
    document.getElementById('zoom-slider').value = value * 10;
}

function setMinAndMaxSlider() {
    let slider = document.getElementById('zoom-slider');
    slider.max = ZOOM_MAX * 10;
    slider.min = ZOOM_MIN * 10;
}
setMinAndMaxSlider();

function focusOnCommit() {
    tree.isFocusDetached = false;
}

// File event handlers
