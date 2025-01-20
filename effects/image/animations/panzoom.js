export class PanZoomAnimation {
    constructor(config) {
        this.config = {
            fadeIn: {
                duration: 2,
                ease: "power2.inOut"
            },
            fadeOut: {
                duration: 2,
                ease: "power2.inOut"
            },
            transitionEase: "power2.inOut",
            ...config
        };
        this.currentKeyframe = -1;
    }

    isActive() {
        // Return true if any timeline is still playing
        return this.mainTL.isActive();
    }

    createTimeline(container, imageScale, dimensions, renderer) {
        const image = container.originalImage;
        image.alpha = 0;
    
        const referenceScale = Math.min(
            renderer.width / dimensions.width,
            renderer.height / dimensions.height
        );
    
        const maxScale = referenceScale * 3;
    
        const mainTL = gsap.timeline({ paused: true });
    
        const animateToKeyframe = (index) => {
            console.log(`Animating to keyframe ${index}`);
            mainTL.clear();
            
            if (index >= this.config.keyframes.length) {
                console.log('No more keyframes, starting fadeout');
                mainTL.to(image, {
                    alpha: 0,
                    duration: this.config.fadeOut.duration,
                    ease: this.config.fadeOut.ease
                });
                mainTL.play();
                return;
            }
    
            const view = this.config.keyframes[index].view;
            
            // Calculate scale relative to reference scale
            const targetScale = view.scale * referenceScale;
            
            // Invert the x and y translations to match preview behavior
            // When view.x is positive (moving view right), we move image left (negative)
            const targetX = renderer.width / 2 + (renderer.width * -view.x);
            const targetY = renderer.height / 2 + (renderer.height * -view.y);
            
            if (index === 0) {
                image.scale.set(targetScale);
                image.position.set(targetX, targetY);
                mainTL.to(image, {
                    alpha: 1,
                    duration: this.config.fadeIn.duration,
                    ease: this.config.fadeIn.ease
                });
            } else {
                const proxy = {
                    x: image.position.x,
                    y: image.position.y,
                    scale: image.scale.x
                };
    
                mainTL.to(proxy, {
                    x: targetX,
                    y: targetY,
                    scale: targetScale,
                    duration: view.duration,
                    ease: this.config.transitionEase,
                    onUpdate: () => {
                        image.position.set(proxy.x, proxy.y);
                        image.scale.set(proxy.scale);
                    }
                });
            }
    
            mainTL.play();
        };
    
        // Save references for complete method
        this.mainTL = mainTL;
        this.image = image;
    
        return {
            timeline: mainTL,
            handleKeyPress: () => {
                if (this.currentKeyframe === -1) {
                    this.currentKeyframe = 0;
                    animateToKeyframe(0);
                } else if (mainTL.isActive()) {
                    mainTL.progress(1);
                } else {
                    this.currentKeyframe++;
                    animateToKeyframe(this.currentKeyframe);
                }
            }
        };
    }

    async complete() {
        // Skip to the end of all animations
        return new Promise(resolve => {
            // If we're still in the middle of keyframe animations
            if (this.currentKeyframe < this.config.keyframes.length - 1) {
                // Skip to final keyframe
                this.currentKeyframe = this.config.keyframes.length - 1;
                const finalKeyframe = this.config.keyframes[this.currentKeyframe];
                
                // Immediately set final position
                this.mainTL.progress(1);
                
                // Start fadeout
                this.mainTL.to(this.image, {
                    alpha: 0,
                    duration: this.config.fadeOut.duration,
                    ease: this.config.fadeOut.ease,
                    onComplete: resolve
                });
            } else {
                // If we're already at the end, just resolve
                resolve();
            }
        });
    }
}