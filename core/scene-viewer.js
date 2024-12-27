import { getGeometryType, getGeometryAssetPath } from './geometry-registry.js';
import { getGeometryAnimation, getImageAnimation, getTextAnimation } from './animation-registry.js';


export class SceneManager {
    constructor(app) {
        this.app = app;
        this.textAnimation = null;
        this.imageAnimation = null;
        this.geometryAnimation = null;
        // Add containers that we can clear between scenes
        this.imageContainer = new PIXI.Container();
        this.geometryContainer = new PIXI.Container();
        this.textContainer = new PIXI.Container();
        
        app.stage.addChild(this.imageContainer);
        app.stage.addChild(this.geometryContainer);
        app.stage.addChild(this.textContainer);

        console.log('Stage hierarchy:', {
            stageChildren: app.stage.children.length,
            imageParent: this.imageContainer.parent === app.stage,
            geometryParent: this.geometryContainer.parent === app.stage,
            textParent: this.textContainer.parent === app.stage
        });

        // Store bound event handler so we can remove it later
        this.boundKeyHandler = this.handleKeyDown.bind(this);
    }

    // Move the event handling logic to its own method
    handleKeyDown(e) {
        if (e.code === 'Space' && this.textAnimation) {
            e.preventDefault();
            console.log('Space pressed - handling text progress');
            if (this.textAnimation) {
                this.textAnimation.animateNextLine();
            }
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
    }

    setupControls(config) {
        // Remove any existing event listener first
        document.removeEventListener('keydown', this.boundKeyHandler);
        // Add new event listener
        document.addEventListener('keydown', this.boundKeyHandler);
    }

    async clearCurrentScene() {
        console.log('Clearing current scene');
        
        // Remove event listener
        document.removeEventListener('keydown', this.boundKeyHandler);
        
        // Clear all PIXI containers
        this.imageContainer.removeChildren();
        this.geometryContainer.removeChildren();
        this.textContainer.removeChildren();
        
        // Clear animations
        this.imageAnimation = null;
        this.geometryAnimation = null;
        this.textAnimation = null;
    }

    async loadScene(config) {

        try{
            // Clear previous scene first
            await this.clearCurrentScene();
            
            console.log('Loading new scene:', config.id);

            // Load and setup base image
            console.log('Loading texture from:', '/assets/images/' + config.image.path);
            const texture = await PIXI.Assets.load('/assets/images/' + config.image.path);
            console.log('Texture loaded:', texture);
            const image = new PIXI.Sprite(texture);
            console.log('Sprite created:', image);
            
            // Calculate scale
            const canvasScale = 1.0 - (config.image.padding || 0);
            const imageScale = Math.min(
                (this.app.screen.width * canvasScale) / texture.width,
                (this.app.screen.height * canvasScale) / texture.height
            );
            console.log('Calculated scales:', {
                canvasScale,
                imageScale,
                screenWidth: this.app.screen.width,
                screenHeight: this.app.screen.height,
                textureWidth: texture.width,
                textureHeight: texture.height
            });
            
            // Setup base image
            image.anchor.set(0.5);
            image.position.set(this.app.screen.width / 2, this.app.screen.height / 2);
            image.scale.set(imageScale);
            image.alpha = 0;

            console.log('Image properties set:', {
                position: image.position,
                scale: image.scale,
                alpha: image.alpha
            });

            // Create container for image and its animations
            // const imageContainer = new PIXI.Container();
            // imageContainer.position.set(this.app.screen.width / 2, this.app.screen.height / 2);
            // imageContainer.originalImage = image;
            
            // Add containers to stage
            // this.app.stage.addChild(imageContainer);
            this.imageContainer.addChild(image);
            this.imageContainer.originalImage = image;

            // Handle image animation setup
            const AnimationClass = getImageAnimation(config.image.animation?.type);
            const animation = new AnimationClass(config.image.animation?.config || {});
            
            this.imageAnimation = animation.createTimeline(
                this.imageContainer,
                imageScale,
                { width: texture.width, height: texture.height },
                this.app.renderer
            );
            
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
                    this.imageContainer,
                    imageScale,
                    { width: texture.width, height: texture.height },
                    this.app.renderer
                );
            }

            // Setup text if present
            if (config.text) {
                console.log('Setting up text animation');
                const TextAnimationClass = getTextAnimation(config.text.animation.type);
                this.textAnimation = new TextAnimationClass(config.text.animation.config);
                
                // Create text container
                console.log('Creating text container');
                const textContainer = this.textAnimation.createContainer(this.app);
                console.log('Text container created:', textContainer);
                console.log('Before adding to stage - textContainer parent:', textContainer.parent);
                this.textContainer.addChild(textContainer);
                console.log('After adding to stage - textContainer parent:', textContainer.parent);
                console.log('Main text container children:', this.textContainer.children);
                
                if (config.text.verses && config.text.verses.length > 0) {
                    console.log('Setting verses:', config.text.verses);
                    this.textAnimation.setVerses(textContainer, config.text.verses);

                }
            }

            // Setup controls
            this.setupControls(config);
            console.log('Scene load complete');
        } catch (error) {
            console.error('Error loading scene:', error);
        }
    }

    isSceneActive() {
        console.log('Checking scene activity');
        
        // Check if any animations are still running
        const imageActive = this.imageAnimation?.isActive?.() || false;
        const geometryActive = this.geometryAnimation?.isActive?.() || false;
        const textActive = this.textAnimation?.hasMoreContent?.() || false;
        
        console.log('Activity status:', {
            imageActive,
            geometryActive,
            textActive
        });
        
        return imageActive || geometryActive || textActive;
    }

    async completeCurrentScene() {
        console.log('Starting scene completion');
        
        // Complete any ongoing animations
        if (this.imageAnimation?.timeline) {
            console.log('Completing image animation');
            this.imageAnimation.timeline.progress(1).kill();
        }
    
        if (this.geometryAnimation?.timeline) {
            console.log('Completing geometry animation');
            this.geometryAnimation.timeline.progress(1).kill();
        }
    
        if (this.textAnimation) {
            console.log('Completing text animation');
            await this.textAnimation.complete();
            console.log('Text animation completed');
        }
        
        console.log('Clearing scene');
        await this.clearCurrentScene();
        console.log('Scene completion finished');
        
        return Promise.resolve();
    }
}