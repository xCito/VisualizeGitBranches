
function closeSidePanel() {
    console.log('hey')
    let p = document.getElementsByClassName('side-panel')[0];
    p.style.width = "0px";
    // p.style.height = "0vh";
}
function openSidePanel() {
    console.log('hey')
    let p = document.getElementsByClassName('side-panel')[0];
    p.style.width = "400px"
    // p.style.height = "100vh";
}

setTimeout(() => {
    closeSidePanel();
}, 3000);