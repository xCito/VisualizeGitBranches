const ZOOM_MIN = 0.3;
const ZOOM_MAX = 2.0;
const ZOOM_STEP = 0.1;
const ZOOM_LERP = 0.1;
const PAN_LERP = 0.2;

class CanvasControl {
    constructor() {    
        this.zoom = 1.0;
        this.panX = 0;
        this.panY = 0;

        this.zoomDest = this.zoom;
        this.panDestX = this.panX;
        this.panDestY = this.panY;
    
    }

    growTree() {
        let val = this.zoomDest + ZOOM_STEP;
        this.setZoomScaler( val );
    }
    shrinkTree() {
        let val = this.zoomDest - ZOOM_STEP;
        this.setZoomScaler( val );
    }
    
    setZoomScaler( value ) {
        value = constrain(value, ZOOM_MIN, ZOOM_MAX);
        this.zoomDest = value;
        updateSliderOnUI(value);
    }

    updatePanCoordinates(deltaX = 0, deltaY = 0) {
        this.panDestX += deltaX;
        this.panDestY += deltaY;
    }

    getRect() {
        let rectX = 0;
        let rectY = 0;
        let rectW = windowWidth / this.zoom;
        let rectH = windowHeight / this.zoom;

        return { x: rectX, y: rectY, w: rectW, h: rectH};
    }

    update() {
        // Update zoom lerping
        this.zoom = lerp(this.zoom, this.zoomDest, ZOOM_LERP);
        this.panX = lerp(this.panX, this.panDestX, PAN_LERP);
        this.panY = lerp(this.panY, this.panDestY, PAN_LERP);

        this.zoom = abs(this.zoom - this.zoomDest) < 0.001 ? this.zoomDest : this.zoom; 
        this.panX = abs(this.panX - this.panDestX) < 1 ? this.panDestX : this.panX; 
        this.panY = abs(this.panY - this.panDestY) < 1 ? this.panDestY : this.panY; 
    }
}

const canvasControl = new CanvasControl();