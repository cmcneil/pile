import { LineArtGeometry } from '../effects/geometry/types/lineart.js';
import { FallingAnimation } from '../effects/geometry/animations/falling.js';
import { SlideStackAnimation } from '../effects/text/animations/slide-stack.js';

export class SceneManager {
    constructor(app) {
        this.app = app;
        this.textAnimation = null;
        this.geometryTimeline = null;
    }

    async loadScene(config) {
        // Load image
        const texture = await PIXI.Assets.load(config.image.path);
        const image = new PIXI.Sprite(texture);
        
        // Calculate scale
        const imageScale = Math.min(
            (this.app.screen.width * 0.8) / texture.width,
            (this.app.screen.height * 0.8) / texture.height
        );
        
        // Setup image
        image.anchor.set(0.5);
        image.position.set(this.app.screen.width / 2, this.app.screen.height / 2);
        image.scale.set(imageScale);
        image.alpha = 0;
        
        // Load geometry
        const geometryData = await fetch(config.image.geometry.data).then(r => r.json());
        const geometry = new LineArtGeometry(geometryData);
        
        // Setup geometry container
        const geometryContainer = new PIXI.Container();
        geometryContainer.position.set(this.app.screen.width / 2, this.app.screen.height / 2);
        geometryContainer.originalImage = image;
        
        // Create animations
        const geometryAnimation = new FallingAnimation(geometry, {
            ...config.image.geometry.animation.config,
            duration: config.duration // Pass total duration to animation
        });
        this.textAnimation = new SlideStackAnimation(config.text.animation.config);
        
        // Add containers to stage
        this.app.stage.addChild(image);
        this.app.stage.addChild(geometryContainer);
        
        // Create text container and set up verses
        const textContainer = this.textAnimation.createContainer(this.app);
        this.app.stage.addChild(textContainer);
        
        // Pass all verses to the text animation
        if (config.text.verses && config.text.verses.length > 0) {
            this.textAnimation.setVerses(textContainer, config.text.verses);
        }
        
        // Create but don't start timeline
        this.geometryTimeline = geometryAnimation.createTimeline(
            geometryContainer, 
            imageScale,
            { width: texture.width, height: texture.height }
        );
        this.geometryTimeline.pause();

        // Set up verses using the correct method name
        if (config.text.verses && config.text.verses.length > 0) {
            this.textAnimation.setVerses(textContainer, config.text.verses);
        }

        // Set up keyboard controls
        this.setupControls();
    }

    setupControls() {
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && this.textAnimation) {
                e.preventDefault();
                this.textAnimation.animateNextLine();
            } else if (e.code === 'Enter' && this.geometryTimeline) {
                this.geometryTimeline.play();
            }
        });
    }
}