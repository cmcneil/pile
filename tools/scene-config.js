// import { AnimationSchemas } from '../animation-registry.js';

import { ANIMATION_SCHEMAS } from '/schemas/index.js';

let currentScene = null;
let currentConfig = {
    verses: [],
    keyframes: []
};

let currentScale = 1;
let currentX = 0;
let currentY = 0;
let isDragging = false;
let startX = 0;
let startY = 0;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupImageDragAndZoom();
    populateAnimationTypes();
    loadSceneList();
});

function setupImageDragAndZoom() {
    const container = document.querySelector('.preview-container');
    const wrapper = document.querySelector('.image-wrapper');

    wrapper.addEventListener('mousedown', startDrag);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', endDrag);
    container.addEventListener('wheel', handleZoom);
}

function startDrag(e) {
    isDragging = true;
    const transform = new DOMMatrix(getComputedStyle(e.target).transform);
    startX = e.clientX - transform.e;
    startY = e.clientY - transform.f;
    e.target.style.cursor = 'grabbing';
}

function drag(e) {
    if (!isDragging) return;
    e.preventDefault();
    
    const wrapper = document.querySelector('.image-wrapper');
    currentX = e.clientX - startX;
    currentY = e.clientY - startY;
    
    updateImageTransform();
}

function endDrag(e) {
    if (!isDragging) return;
    isDragging = false;
    const wrapper = document.querySelector('.image-wrapper');
    wrapper.style.cursor = 'grab';
}

function updateImageTransform() {
    const wrapper = document.querySelector('.image-wrapper');
    wrapper.style.transform = `translate(${currentX}px, ${currentY}px) scale(${currentScale})`;
}

function zoomIn() {
    currentScale = Math.min(5, currentScale * 1.2);
    updateImageTransform();
}

function zoomOut() {
    currentScale = Math.max(0.1, currentScale / 1.2);
    updateImageTransform();
}

function handleZoom(e) {
    e.preventDefault();
    if (e.deltaY < 0) {
        zoomIn();
    } else {
        zoomOut();
    }
}




// Scene List Management
// async function loadSceneList() {
//     try {
//         const response = await fetch('/api/scenes');
//         const scenes = await response.json();
//         const container = document.getElementById('sceneListContainer');
        
//         container.innerHTML = scenes.map(scene => `
//             <div class="scene-item" onclick="loadScene('${scene.id}')">
//                 <img src="/assets/images/${scene.image}" 
//                      class="scene-thumbnail" 
//                      alt="${scene.id}">
//                 <div>
//                     <div>${scene.id}</div>
//                 </div>
//             </div>
//         `).join('');
//     } catch (error) {
//         console.error('Error loading scenes:', error);
//     }
// }

async function loadSceneList() {
    try {
        const response = await fetch('/api/scenes');
        const scenes = await response.json();
        const container = document.getElementById('sceneListContainer');
        
        container.innerHTML = scenes.map(scene => `
            <div class="scene-item" data-scene-id="${scene.id}">
                <img src="/assets/images/${scene.image}" 
                     class="scene-thumbnail" 
                     alt="${scene.id}">
                <div>
                    <div>${scene.id}</div>
                </div>
            </div>
        `).join('');

        // Add event listeners after creating elements
        container.querySelectorAll('.scene-item').forEach(item => {
            item.addEventListener('click', () => {
                loadScene(item.dataset.sceneId);
            });
        });
    } catch (error) {
        console.error('Error loading scenes:', error);
    }
}

async function loadScene(sceneId) {
    try {
        const response = await fetch(`/api/scenes/${sceneId}`);
        currentScene = await response.json();
        console.log('Loaded scene:', currentScene);
        
        // Update form with scene data
        document.getElementById('sceneId').value = currentScene.id;
        
        // Load image
        const previewImage = document.getElementById('previewImage');
        if (currentScene.image && currentScene.image.path) {
            previewImage.src = `/assets/images/${currentScene.image.path}`;
            document.getElementById('currentImage').textContent = currentScene.image.path;
        }
        
        // Set animation type and update UI
        let animationType = 'image';
        let animationName = '';
        
        if (currentScene.image.animation) {
            animationName = currentScene.image.animation.type;
            console.log('Found image animation:', animationName);
            if (animationName === 'panzoom') {
                currentConfig.keyframes = currentScene.image.animation.config.keyframes || [];
                console.log('Loaded keyframes:', currentConfig.keyframes);
            }
        } else if (currentScene.image.geometry) {
            animationType = 'geometry';
            animationName = currentScene.image.geometry.animation.type;
            console.log('Found geometry animation:', animationName);
        }
        
        const animationSelect = document.getElementById('animationType');
        const animationValue = `${animationType}-${animationName}`;
        console.log('Setting animation type to:', animationValue);
        animationSelect.value = animationValue;
        updateAnimationUI();
        
        // Load verses
        currentConfig.verses = currentScene.text.verses || [];
        updateVerseList();
    } catch (error) {
        console.error('Error loading scene:', error);
    }
}

// Animation Type Management
function populateAnimationTypes() {
    const select = document.getElementById('animationType');
    const imageGroup = select.querySelector('optgroup[label="Image Animations"]');
    const geometryGroup = select.querySelector('optgroup[label="Geometry Animations"]');
    
    // Add image animation types
    Object.entries(ANIMATION_SCHEMAS.image).forEach(([key, value]) => {
        const option = document.createElement('option');
        option.value = `image-${key}`;
        option.textContent = value.name;
        imageGroup.appendChild(option);
    });
    
    // Add geometry animation types
    Object.entries(ANIMATION_SCHEMAS.geometry).forEach(([key, value]) => {
        const option = document.createElement('option');
        option.value = `geometry-${key}`;
        option.textContent = value.name;
        geometryGroup.appendChild(option);
    });
}

function updateAnimationUI() {
    const [type, name] = document.getElementById('animationType').value.split('-');
    const schema = ANIMATION_SCHEMAS[type]?.[name];
    const configContainer = document.getElementById('animationConfig');
    
    console.log('Updating animation UI:', { type, name, schema });
    
    if (!schema) {
        configContainer.innerHTML = '';
        console.log('No schema found, cleared config container');
        return;
    }
    
    const configHtml = generateConfigUI(schema.config);
    console.log('Generated config HTML:', configHtml);
    configContainer.innerHTML = configHtml;
    
    // If loading existing config, update the UI with saved values
    if (currentScene && currentScene.image) {
        const config = type === 'image' ? 
            currentScene.image.animation?.config :
            currentScene.image.geometry?.animation?.config;
        
        console.log('Current scene config:', config);
            
        if (config) {
            updateConfigUI(config);
        }
        
        // Update keyframes if they exist
        if (config?.keyframes) {
            console.log('Found keyframes:', config.keyframes);
            currentConfig.keyframes = config.keyframes;
            updateKeyframeList();
        }
    }
}

// Add this helper function to update UI with saved values
function updateConfigUI(config) {
    Object.entries(config).forEach(([key, value]) => {
        if (typeof value === 'object' && value !== null) {
            // Handle nested config (like fadeIn, fadeOut)
            Object.entries(value).forEach(([subKey, subValue]) => {
                const element = document.getElementById(`${key}.${subKey}`);
                if (element) {
                    element.value = subValue;
                }
            });
        } else if (key !== 'keyframes') {  // Skip keyframes as they're handled separately
            const element = document.getElementById(key);
            if (element) {
                element.value = value;
            }
        }
    });
}


function generateConfigUI(schema, prefix = '') {
    console.log('Generating config UI for schema:', schema);
    
    return Object.entries(schema).map(([key, field]) => {
        const id = prefix ? `${prefix}.${key}` : key;
        console.log('Processing field:', { key, field, id });
        
        if (field.type === 'group') {
            return `
                <div class="config-group">
                    <h4>${key}</h4>
                    ${generateConfigUI(field.fields, id)}
                </div>
            `;
        }
        
        if (field.type === 'keyframes') {
            console.log('Generating keyframe controls');
            return `
                <div class="keyframe-section">
                    <h4>Keyframes</h4>
                    <button onclick="captureKeyframe()">Capture Current View</button>
                    <div id="keyframeList"></div>
                </div>
            `;
        }
        
        return `
            <div class="form-group">
                <label for="${id}">${key}:</label>
                ${generateInputForType(field, id)}
            </div>
        `;
    }).join('');
}

function generateInputForType(field, id) {
    switch (field.type) {
        case 'number':
            return `
                <input type="number" 
                       id="${id}"
                       value="${field.default}"
                       min="${field.min}"
                       max="${field.max || ''}"
                       step="${field.step}"
                       onchange="updateConfig('${id}', this.value)">
            `;
        case 'select':
            return `
                <select id="${id}" onchange="updateConfig('${id}', this.value)">
                    ${field.options.map(opt => 
                        `<option value="${opt}" ${opt === field.default ? 'selected' : ''}>${opt}</option>`
                    ).join('')}
                </select>
            `;
        default:
            return `<input type="text" id="${id}" value="${field.default || ''}"}>`;
    }
}

// Image Upload and Processing
document.getElementById('imageUpload').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('image', file);
    
    try {
        const response = await fetch('/api/upload-image', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            const previewImage = document.getElementById('previewImage');
            previewImage.src = `/assets/images/${result.filename}`;
            document.getElementById('currentImage').textContent = result.filename;
            
            // Reset transform
            currentScale = 1;
            currentX = 0;
            currentY = 0;
            updateImageTransform();
        }
    } catch (error) {
        console.error('Error uploading image:', error);
    }
});










// // Image Upload Handler
// document.getElementById('imageUpload').addEventListener('change', (e) => {
//     const file = e.target.files[0];
//     if (file) {
//         const reader = new FileReader();
//         reader.onload = (e) => {
//             const previewImage = document.getElementById('previewImage');
//             previewImage.src = e.target.result;
//             previewImage.onload = () => {
//                 // Reset transform when new image is loaded
//                 currentScale = 1;
//                 currentX = 0;
//                 currentY = 0;
//                 updateImageTransform();
//             };
//         };
//         reader.readAsDataURL(file);
//     }
// });

function addVerse() {
    currentConfig.verses.push({
        id: currentConfig.verses.length + 1,
        lines: []
    });
    updateVerseList();
}

function updateVerseList() {
    const verseList = document.getElementById('verseList');
    verseList.innerHTML = currentConfig.verses.map((verse, verseIndex) => `
        <div class="verse-container">
            <h4>Verse ${verse.id}</h4>
            <textarea
                rows="6"
                style="width: 100%; margin-bottom: 10px;"
                onchange="updateVerseText(${verseIndex}, this.value)"
            >${verse.lines.join('\n')}</textarea>
            <button onclick="removeVerse(${verseIndex})">Remove Verse</button>
        </div>
    `).join('');
}

function updateVerseText(verseIndex, text) {
    // Split text on newlines and filter out empty lines
    const lines = text.split('\n').filter(line => line.trim() !== '');
    currentConfig.verses[verseIndex].lines = lines;
}

function removeVerse(verseIndex) {
    currentConfig.verses.splice(verseIndex, 1);
    // Update IDs for remaining verses
    currentConfig.verses.forEach((verse, index) => {
        verse.id = index + 1;
    });
    updateVerseList();
}

function captureKeyframe() {
    const wrapper = document.querySelector('.image-wrapper');
    const rect = wrapper.getBoundingClientRect();
    const containerRect = wrapper.parentElement.getBoundingClientRect();
    
    // Calculate normalized position (0-1) relative to container center
    const containerCenterX = containerRect.width / 2;
    const containerCenterY = containerRect.height / 2;
    
    const x = (containerCenterX - (rect.left + rect.width / 2)) / (rect.width * currentScale);
    const y = (containerCenterY - (rect.top + rect.height / 2)) / (rect.height * currentScale);
    
    const keyframe = {
        view: {
            x: 0.5 + x,
            y: 0.5 + y,
            scale: currentScale,
            duration: 2
        }
    };

    currentConfig.keyframes.push(keyframe);
    updateKeyframeList();
}

function updateKeyframeList() {
    const keyframeList = document.getElementById('keyframeList');
    keyframeList.innerHTML = currentConfig.keyframes.map((keyframe, index) => `
        <div class="keyframe-item">
            <div>Keyframe ${index + 1}</div>
            <div>Scale: ${keyframe.view.scale.toFixed(2)}</div>
            <div>Position: (${keyframe.view.x.toFixed(2)}, ${keyframe.view.y.toFixed(2)})</div>
            <input type="number" 
                   value="${keyframe.view.duration}" 
                   step="0.1" 
                   onchange="updateKeyframeDuration(${index}, this.value)"
                   style="width: 60px;"> seconds
            <button onclick="removeKeyframe(${index})">Remove</button>
        </div>
    `).join('');
}

function updateKeyframeDuration(index, duration) {
    currentConfig.keyframes[index].view.duration = parseFloat(duration);
}

function removeKeyframe(index) {
    currentConfig.keyframes.splice(index, 1);
    updateKeyframeList();
}

function createNewScene() {
    // Clear current scene data
    currentScene = null;
    currentConfig = {
        verses: [],
        keyframes: []
    };

    // Reset form fields
    document.getElementById('sceneId').value = '';
    document.getElementById('animationType').value = '';
    document.getElementById('currentImage').textContent = '';
    
    // Clear image preview
    const previewImage = document.getElementById('previewImage');
    previewImage.src = '';
    
    // Reset image transform
    currentScale = 1;
    currentX = 0;
    currentY = 0;
    updateImageTransform();
    
    // Clear verses and keyframes
    updateVerseList();
    updateKeyframeList();
    
    // Hide keyframe controls
    document.getElementById('keyframeControls').style.display = 'none';
    
    // Reset animation config
    document.getElementById('animationConfig').innerHTML = '';

    // Focus on scene ID input
    document.getElementById('sceneId').focus();
}

// Save Scene
async function saveScene() {
    const [animationType, animationName] = document.getElementById('animationType').value.split('-');
    const sceneData = {
        id: document.getElementById('sceneId').value,
        image: {
            path: document.getElementById('currentImage').textContent,
            padding: 0.01
        },
        text: {
            verses: currentConfig.verses,
            animation: {
                type: "slidestack",
                config: {
                    slideDistance: 100,
                    slideDuration: 0.5,
                    pushDuration: 0.4,
                    bottomPadding: 50
                }
            }
        }
    };

    // Add animation configuration based on type
    if (animationType === 'image') {
        sceneData.image.animation = {
            type: animationName,
            config: collectConfig(ANIMATION_SCHEMAS.image[animationName].config)
        };
    } else if (animationType === 'geometry') {
        sceneData.image.geometry = {
            type: ANIMATION_SCHEMAS.geometry[animationName].processorType,
            data: `${sceneData.id}.json`,
            animation: {
                type: animationName,
                config: collectConfig(ANIMATION_SCHEMAS.geometry[animationName].config)
            }
        };
    }

    try {
        const response = await fetch('/api/scenes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(sceneData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            loadSceneList();  // Refresh scene list
            alert('Scene saved successfully!');
        }
    } catch (error) {
        console.error('Error saving scene:', error);
    }
}

function collectConfig(schema, prefix = '') {
    const config = {};
    
    Object.entries(schema).forEach(([key, field]) => {
        const id = prefix ? `${prefix}.${key}` : key;
        
        if (field.type === 'group') {
            config[key] = collectConfig(field.fields, id);
        } else if (field.type === 'keyframes') {
            config[key] = currentConfig.keyframes;
        } else {
            const element = document.getElementById(id);
            if (element) {
                config[key] = field.type === 'number' ? 
                    parseFloat(element.value) : 
                    element.value;
            }
        }
    });
    
    return config;
}


function exportConfig() {
    const config = {
        id: 'scene1',
        duration: 15,
        image: {
            padding: 0.01,
            path: 'assets/images/pile1.jpg',  // This would need to be updated
            animation: {
                type: 'panzoom',
                config: {
                    fadeIn: {
                        duration: 2,
                        ease: "power2.inOut"
                    },
                    fadeOut: {
                        duration: 2,
                        ease: "power2.inOut"
                    },
                    keyframes: currentConfig.keyframes,
                    transitionEase: "power2.inOut"
                }
            }
        },
        text: {
            verses: currentConfig.verses,
            animation: {
                type: "slidestack",
                config: {
                    slideDistance: 100,
                    slideDuration: 0.5,
                    pushDuration: 0.4,
                    bottomPadding: 50
                }
            }
        }
    };

    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'scene-config.json';
    a.click();
    URL.revokeObjectURL(url);
}

console.log('Animation schemas:', ANIMATION_SCHEMAS);
