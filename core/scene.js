import { getGeometryType, getGeometryAssetPath } from './geometry-registry.js';
import { getGeometryAnimation, getImageAnimation, getTextAnimation } from './animation-registry.js';


export class SceneManager {
    constructor(app) {
        this.app = app;
        this.textAnimation = null;
        this.imageAnimation = null;  // Replaces geometryTimeline/geometryAnimation
    }

    handleTextProgress() {
        if (this.textAnimation) {
            this.textAnimation.animateNextLine();
        }
    }

    handleImageProgress() {  // Renamed from handleGeometryProgress
        if (this.imageAnimation) {
            if (this.imageAnimation.handleKeyPress) {
                this.imageAnimation.handleKeyPress();
            } else if (this.imageAnimation.timeline) {
                this.imageAnimation.timeline.play();
            }
        }
    }

    handleGeometryProgress() {
        if (this.geometryAnimation) {
            if (this.geometryAnimation.handleKeyPress) {
                this.geometryAnimation.handleKeyPress();
            } else if (this.geometryAnimation.timeline) {
                this.geometryAnimation.timeline.play();
            }
        }
    }

    setupControls(config) {
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && this.textAnimation) {
                e.preventDefault();
                console.log('Space pressed - handling text progress');
                this.handleTextProgress();
            } else if (e.code === 'Enter') {
                e.preventDefault();
                console.log('Enter pressed');
                if (this.imageAnimation) {
                    console.log('Handling image animation');
                    console.log('Current image animation:', this.imageAnimation);
                    this.imageAnimation.handleKeyPress();
                }
                if (this.geometryAnimation) {
                    console.log('Handling geometry animation');
                    this.geometryAnimation.handleKeyPress();
                }
            }
        });
    }

    async loadScene(config) {
        // Load and setup base image
        const texture = await PIXI.Assets.load('/assets/images/' + config.image.path);
        const image = new PIXI.Sprite(texture);
        
        // Calculate scale
        const canvasScale = 1.0 - (config.image.padding || 0);
        const imageScale = Math.min(
            (this.app.screen.width * canvasScale) / texture.width,
            (this.app.screen.height * canvasScale) / texture.height
        );
        
        // Setup base image
        image.anchor.set(0.5);
        image.position.set(this.app.screen.width / 2, this.app.screen.height / 2);
        image.scale.set(imageScale);
        image.alpha = 0;

        // Create container for image and its animations
        const imageContainer = new PIXI.Container();
        imageContainer.position.set(this.app.screen.width / 2, this.app.screen.height / 2);
        imageContainer.originalImage = image;
        
        // Add containers to stage
        this.app.stage.addChild(imageContainer);
        this.app.stage.addChild(image);

        // Handle image animation setup
        if (config.image.animation) {
            const AnimationClass = getImageAnimation(config.image.animation.type);
            const animation = new AnimationClass(config.image.animation.config);
            
            this.imageAnimation = animation.createTimeline(
                imageContainer,
                imageScale,
                { width: texture.width, height: texture.height },
                this.app.renderer
            );
        }
        
        // If there's geometry, set it up
        if (config.image.geometry) {
            const GeometryClass = getGeometryType(config.image.geometry.type);
            const geometryPath = getGeometryAssetPath(
                config.image.geometry.type,
                config.image.geometry.data
            );
            
            const geometryData = await fetch(geometryPath).then(r => r.json());
            const geometry = new GeometryClass(geometryData);

            const GeometryAnimationClass = getGeometryAnimation(config.image.geometry.animation.type);
            const geometryAnimation = new GeometryAnimationClass(geometry, {
                ...config.image.geometry.animation.config,
                duration: config.duration
            });
            
            this.imageAnimation = geometryAnimation.createTimeline(
                imageContainer,
                imageScale,
                { width: texture.width, height: texture.height },
                this.app.renderer
            );
        }

        // Setup text if present
        if (config.text) {
            const TextAnimationClass = getTextAnimation(config.text.animation.type);
            this.textAnimation = new TextAnimationClass(config.text.animation.config);
            const textContainer = this.textAnimation.createContainer(this.app);
            this.app.stage.addChild(textContainer);
            
            if (config.text.verses && config.text.verses.length > 0) {
                this.textAnimation.setVerses(textContainer, config.text.verses);
            }
        }

        // Setup controls
        this.setupControls(config);
    }
}