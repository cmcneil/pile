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

    isActive() {
        return this.isSimulating || this.timeline.isActive();
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
        let currentPhase = 0;
    
        const tl = gsap.timeline({
            paused: true,
            onComplete: () => {
                container.removeChild(container.originalImage);
            }
        });
        
        const totalSegments = this.geometry.getTotalSegments();
        const FALL_OFFSET = -window.innerHeight;
    
        // Center container
        container.position.set(
            window.innerWidth / 2,
            window.innerHeight / 2
        );
    
        // Calculate container dimensions based on image scale
        const containerWidth = dimensions.width * imageScale;
        const containerHeight = dimensions.height * imageScale;
        
        // Group segments by level
        const segmentsByLevel = new Map();
        for (let i = 0; i < totalSegments; i++) {
            const { segment, level } = this.geometry.getSegmentAt(i);
            if (!segmentsByLevel.has(level)) {
                segmentsByLevel.set(level, []);
            }
            segmentsByLevel.get(level).push(segment);
        }
        
        // Process segments level by level
        let levelDelay = 0;
        for (const [level, segments] of segmentsByLevel) {
            const levelContainer = new PIXI.Container();
            container.addChild(levelContainer);
            
            // Process segments within this level
            segments.forEach((segment, segmentIndex) => {
                const graphics = new PIXI.Graphics();
                graphics.lineStyle(1, 0xFFFFFF);
                
                // Normalize coordinates to -0.5 to 0.5 range (centered)
                const startX = (segment.start.x / dimensions.width - 0.5) * containerWidth;
                const startY = (segment.start.y / dimensions.height - 0.5) * containerHeight;
                const endX = (segment.end.x / dimensions.width - 0.5) * containerWidth;
                const endY = (segment.end.y / dimensions.height - 0.5) * containerHeight;
                
                graphics.moveTo(startX, startY);
                graphics.lineTo(endX, endY);
                
                levelContainer.addChild(graphics);
            });
            
            // Set initial position for level container
            levelContainer.y = FALL_OFFSET;
            levelContainer.alpha = 0;
            
            // Calculate timing for this level
            const segmentDelay = levelDelay;
            levelDelay += this.config.fallDuration * 0.5; // Overlap levels slightly
            
            // Animate the entire level
            tl.to(levelContainer, {
                alpha: 1,
                duration: 0.1
            }, segmentDelay);
            
            tl.to(levelContainer, {
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
    
        tl.addPause();
    
        return {
            timeline: tl,
            handleKeyPress: () => {
                if (currentPhase === 0) {
                    tl.play();
                    currentPhase++;
                } else if (currentPhase >= 1) {
                    tl.resume();
                    currentPhase++;
                }
            }
        };
    }

    async complete() {
        return new Promise(resolve => {
            // If simulation is still running
            if (this.isSimulating) {
                // Stop physics simulation
                this.isSimulating = false;
                if (this.animationFrame) {
                    cancelAnimationFrame(this.animationFrame);
                }
                
                // Clear physics engine
                World.clear(this.engine.world);
                Engine.clear(this.engine);
            }
            
            // Fade out all particles immediately
            this.timeline.progress(1);
            resolve();
        });
    }

    // Cleanup function to release resources
    cleanup(container, segmentContainers, timeline) {
        // Stop and clear the GSAP timeline
        if (timeline) {
            timeline.kill();
        }

        // Remove all segment containers and their graphics
        segmentContainers.forEach(segmentContainer => {
            segmentContainer.children.forEach(graphic => {
                graphic.destroy(true);
            });
            segmentContainer.removeChildren();
            container.removeChild(segmentContainer);
            segmentContainer.destroy(true);
        });

        // Remove the original image if present
        if (container.originalImage) {
            container.removeChild(container.originalImage);
            container.originalImage.destroy(true);
        }

        // Detach event listener
        document.removeEventListener('keydown', this.handleKeyPress);
    }
}