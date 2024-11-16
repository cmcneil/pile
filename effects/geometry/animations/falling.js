import { LineArtGeometry } from '../types/lineart.js';

export class FallingAnimation {
    static supportedTypes = [LineArtGeometry];
    
    constructor(geometry, config) {
        if (!this.supportsGeometry(geometry)) {
            throw new Error('Unsupported geometry type');
        }
        this.geometry = geometry;
        this.config = config;
    }

    supportsGeometry(geometry) {
        return geometry instanceof LineArtGeometry;
    }

    getSegmentTiming(segmentIndex, totalSegments) {
        const linearProgress = segmentIndex / totalSegments;
        if (this.config.acceleration === 0) {
            return linearProgress * (this.config.duration - 2);
        }
        
        // Use provided duration instead of hardcoded value
        const acceleratedProgress = 1 - Math.pow(1 - linearProgress, 1 + this.config.acceleration);
        return acceleratedProgress * (this.config.duration - 2);
    }

    createTimeline(container, imageScale, dimensions) {
        const tl = gsap.timeline();
        const totalSegments = this.geometry.getTotalSegments();
        const FALL_OFFSET = -window.innerHeight;

        let segmentCount = 0;
        
        // Process each segment
        for (let i = 0; i < totalSegments; i++) {
            const { segment, level } = this.geometry.getSegmentAt(i);
            
            const segmentContainer = new PIXI.Container();
            container.addChild(segmentContainer);
            
            const graphics = new PIXI.Graphics();
            graphics.lineStyle(1, 0xFFFFFF);
            
            const startX = (segment.start.x - dimensions.width/2) * imageScale;
            const startY = (segment.start.y - dimensions.height/2) * imageScale;
            const endX = (segment.end.x - dimensions.width/2) * imageScale;
            const endY = (segment.end.y - dimensions.height/2) * imageScale;
            
            graphics.moveTo(startX, startY);
            graphics.lineTo(endX, endY);
            
            segmentContainer.addChild(graphics);
            segmentContainer.y = FALL_OFFSET;
            segmentContainer.alpha = 0;

            const segmentDelay = this.getSegmentTiming(segmentCount, totalSegments);
            segmentCount++;
            
            tl.to(segmentContainer, {
                alpha: 1,
                duration: 0.1
            }, segmentDelay);
            
            tl.to(segmentContainer, {
                y: 0,
                duration: this.config.fallDuration,
                ease: "power2.out"
            }, segmentDelay);
        }

        // Add fades
        const { fadeIn, fadeOut } = this.config;
        
        if (fadeIn) {
            tl.to(container.originalImage, {
                alpha: 1,
                duration: fadeIn.duration,
                ease: "power1.inOut"
            }, fadeIn.startTime);
        }

        if (fadeOut) {
            tl.to(container, {
                alpha: 0,
                duration: fadeOut.duration,
                ease: "power1.inOut"
            }, fadeOut.startTime);
        }

        return tl;
    }
}