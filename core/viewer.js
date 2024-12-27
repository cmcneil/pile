import { NovelViewer } from './novel-viewer.js';
import { SceneManager } from './scene-viewer.js';

class Viewer {
    constructor(contentType, contentId) {
        this.contentType = contentType;
        this.contentId = contentId;
        
        // Setup PIXI application
        this.app = new PIXI.Application({
            width: window.innerWidth,
            height: window.innerHeight,
            backgroundColor: 0x000000,
            resolution: window.devicePixelRatio || 1,
        });
        document.body.appendChild(this.app.view);

        // Show home button for scene view
        const homeButton = document.getElementById('home-button');
        if (contentType === 'scene') {
            homeButton.style.display = 'block';
        }

        // Initialize appropriate viewer
        if (contentType === 'novel') {
            this.viewer = new NovelViewer(contentId, this.app);  // Pass app to NovelViewer
        } else {
            this.viewer = new SceneManager(this.app);
            this.loadSingleScene();
        }
    }

    async loadSingleScene() {
        try {
            const response = await fetch(`/api/scenes/${this.contentId}`);
            const sceneData = await response.json();
            await this.viewer.loadScene(sceneData);
        } catch (error) {
            console.error('Error loading scene:', error);
        }
    }
}

// Initialize when the page loads
window.addEventListener('DOMContentLoaded', () => {
    window.viewer = new Viewer(window.CONTENT_TYPE, window.CONTENT_ID);
});