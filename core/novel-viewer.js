import { SceneManager } from './scene-viewer.js';

class NovelViewer {
    constructor(novelId) {
        console.log('Initializing NovelViewer with novel:', novelId);
        this.novelId = novelId;
        this.novel = null;
        this.currentSceneIndex = -1;
        this.currentScene = null;
        this.app = new PIXI.Application({
            width: window.innerWidth,
            height: window.innerHeight,
            backgroundColor: 0x000000,
            resolution: window.devicePixelRatio || 1,
        });
        document.body.appendChild(this.app.view);
        
        this.sceneManager = new SceneManager(this.app);
        this.isTransitioning = false;
        
        this.loadNovel();
    }

    async loadNovel() {
        try {
            console.log('Loading novel data...');
            const response = await fetch(`/api/novels/${this.novelId}`);
            this.novel = await response.json();
            console.log('Loaded novel:', this.novel);
            this.setupKeyboardControls();
            this.startNovel();
        } catch (error) {
            console.error('Error loading novel:', error);
        }
    }

    setupKeyboardControls() {
        console.log('Setting up keyboard controls');
        document.addEventListener('keydown', async (e) => {
            console.log('Key pressed:', e.code);
            if (this.isTransitioning) {
                console.log('Ignoring key press - transition in progress');
                return;
            }
    
            try {
                if (e.code === 'KeyN') {
                    console.log('Next scene requested');
                    e.preventDefault();
                    await this.nextScene();
                } else if (e.code === 'KeyP') {
                    console.log('Previous scene requested');
                    e.preventDefault();
                    await this.previousScene();
                }
            } catch (error) {
                console.error('Error handling scene change:', error);
                this.isTransitioning = false;  // Reset in case of error
            }
        });
    }

    async startNovel() {
        console.log('Starting novel, scenes:', this.novel.scenes);
        if (this.novel.scenes.length > 0) {
            this.currentSceneIndex = 0;
            await this.loadScene(this.novel.scenes[0]);
        }
    }

    async loadScene(sceneId) {
        try {
            console.log('Loading scene:', sceneId);
            this.isTransitioning = true;
            
            const response = await fetch(`/api/scenes/${sceneId}`);
            const sceneConfig = await response.json();
            console.log('Loaded scene config:', sceneConfig);
            
            // Always clear the previous scene before loading the new one
            await this.sceneManager.clearCurrentScene();
            
            // Load and initialize the new scene
            console.log('Loading new scene into SceneManager');
            await this.sceneManager.loadScene(sceneConfig);
            
            this.currentScene = sceneConfig;
            this.isTransitioning = false;
        } catch (error) {
            console.error('Error loading scene:', error);
            this.isTransitioning = false;
        }
    }

    async nextScene() {
        console.log('Starting next scene transition');
        if (this.currentSceneIndex < this.novel.scenes.length - 1) {
            this.isTransitioning = true;
            console.log('Setting transition flag');
            try {
                console.log('Completing current scene');
                await this.sceneManager.completeCurrentScene();
                console.log('Current scene completed');
                
                this.currentSceneIndex++;
                console.log('Loading next scene:', this.novel.scenes[this.currentSceneIndex]);
                await this.loadScene(this.novel.scenes[this.currentSceneIndex]);
                console.log('Next scene loaded');
            } finally {
                this.isTransitioning = false;
                console.log('Transition flag cleared');
            }
        } else {
            console.log('At last scene');
        }
    }

    async previousScene() {
        if (this.currentSceneIndex > 0) {
            this.isTransitioning = true;
            try {
                await this.sceneManager.completeCurrentScene();
                this.currentSceneIndex--;
                await this.loadScene(this.novel.scenes[this.currentSceneIndex]);
            } finally {
                this.isTransitioning = false;
            }
        } else {
            console.log('At first scene');
        }
    }
}

// Initialize when the page loads
console.log('Novel viewer script loaded');
window.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing novel viewer with ID:', window.NOVEL_ID);
    window.novelViewer = new NovelViewer(window.NOVEL_ID);
});