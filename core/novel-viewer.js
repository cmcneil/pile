class NovelViewer {
    constructor(novelId) {
        this.novelId = novelId;
        this.novel = null;
        this.currentSceneIndex = -1;
        this.currentScene = null;
        this.loadNovel();
    }

    async loadNovel() {
        const response = await fetch(`/api/novels/${this.novelId}`);
        this.novel = await response.json();
        this.setupKeyboardControls();
        this.startNovel();
    }

    setupKeyboardControls() {
        document.addEventListener('keydown', (e) => {
            if (e.code === 'KeyN') {
                this.nextScene();
            }
        });
    }

    async startNovel() {
        if (this.novel.scenes.length > 0) {
            this.currentSceneIndex = 0;
            await this.loadScene(this.novel.scenes[0]);
        }
    }

    async loadScene(sceneId) {
        const response = await fetch(`/api/scenes/${sceneId}`);
        const sceneConfig = await response.json();
        // Initialize scene with its config
        // (This would use your existing scene initialization code)
    }

    async nextScene() {
        if (this.currentSceneIndex < this.novel.scenes.length - 1) {
            this.currentSceneIndex++;
            await this.loadScene(this.novel.scenes[this.currentSceneIndex]);
        }
    }
}

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const novelId = window.NOVEL_ID;  // Set by the template
    new NovelViewer(novelId);
});