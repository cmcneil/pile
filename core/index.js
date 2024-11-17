import { SceneManager } from '/core/scene.js';

// Initialize PIXI
const app = new PIXI.Application({
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: 0x000000,
    resolution: window.devicePixelRatio || 1,
    antialias: true
});
document.body.appendChild(app.view);

// Create scene manager
const sceneManager = new SceneManager(app);

// Load and start scene
async function start() {
    const sceneid = window.SCENE_ID;
    const config = await fetch('/scenes/configs/' + sceneid + '.json').then(r => r.json());
    const result = await sceneManager.loadScene(config);
    
    // Handle keyboard controls
    // document.addEventListener('keydown', (e) => {
    //     if (e.code === 'Space') {
    //         e.preventDefault();
    //         sceneManager.handleTextProgress();
    //     } else if (e.code === 'Enter') {
    //         e.preventDefault();
    //         sceneManager.handleGeometryProgress();
    //     }
    // });
}

start().catch(console.error);