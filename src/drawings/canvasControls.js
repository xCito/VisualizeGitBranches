const ZOOM_MIN = 0.3;
const ZOOM_MAX = 1.3;
const ZOOM_STEP = 0.1;

class CanvasControl {
    constructor() {    
        this.zoom = 1.0;
        this.panX = 0;
        this.panY = 0;
    
    }

    growTree() {
        let val = this.zoom + ZOOM_STEP;
        if(val > ZOOM_MAX)
            val = ZOOM_MAX;
        this.setZoomScaler( val );
    }
    shrinkTree() {
        let val = this.zoom - ZOOM_STEP;
        if(val < ZOOM_MIN)
            val = ZOOM_MIN;
        this.setZoomScaler( val );
    }

    setZoomScaler( value ) {
        if (value <= ZOOM_MAX && value >= ZOOM_MIN) {
            this.zoom = value;
            tree.updateTree();
            updateSliderOnUI(value);
        }
    }

    updatePanCoordinates(deltaX, deltaY) {
        this.panX += deltaX;
        this.panY += deltaY;
    }
}

const canvasControl = new CanvasControl();