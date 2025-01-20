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
// document.addEventListener('DOMContentLoaded', () => {
//     setupImageDragAndZoom();
//     populateAnimationTypes();
//     loadSceneList();
// });

export function initializeSceneConfig(ANIMATION_SCHEMAS) {
    // Set up event listeners
    document.getElementById('animationType').addEventListener('change', updateAnimationUI);
    document.getElementById('newSceneButton').addEventListener('click', createNewScene);
    document.getElementById('saveSceneButton').addEventListener('click', saveScene);
    document.getElementById('zoomInButton').addEventListener('click', zoomIn);
    document.getElementById('zoomOutButton').addEventListener('click', zoomOut);
    document.getElementById('captureKeyframeButton')?.addEventListener('click', captureKeyframe);
    document.getElementById('addVerseButton')?.addEventListener('click', addVerse);

    
    // Initialize components
    setupImageDragAndZoom();
    populateAnimationTypes(ANIMATION_SCHEMAS);
    loadSceneList();
    setupPreview();
}

function updateCoordinateDisplay() {
    const wrapper = document.querySelector('.image-wrapper');
    const container = wrapper.parentElement;
    const referenceScale = parseFloat(container.dataset.referenceScale);
    
    // Now scale is relative to the container-filling size
    const normalizedScale = currentScale / referenceScale;
    
    const containerRect = container.getBoundingClientRect();
    const wrapperRect = wrapper.getBoundingClientRect();
    
    const containerCenterX = containerRect.left + containerRect.width / 2;
    const containerCenterY = containerRect.top + containerRect.height / 2;
    const imageCenterX = wrapperRect.left + wrapperRect.width / 2;
    const imageCenterY = wrapperRect.top + wrapperRect.height / 2;
    
    // Position calculations remain the same
    const normalizedX = (containerCenterX - imageCenterX) / (wrapperRect.width * normalizedScale);
    const normalizedY = (containerCenterY - imageCenterY) / (wrapperRect.height * normalizedScale);
    
    const display = document.getElementById('coordinateDisplay');
    if (display) {
        display.textContent = `Position: (${normalizedX.toFixed(3)}, ${normalizedY.toFixed(3)}) Scale: ${normalizedScale.toFixed(3)}`;
    }
}

function setupImageDragAndZoom() {
    const container = document.querySelector('.preview-container');
    const wrapper = document.querySelector('.image-wrapper');

    // Remove existing listeners first to prevent duplicates
    wrapper.removeEventListener('mousedown', startDrag);
    document.removeEventListener('mousemove', drag);
    document.removeEventListener('mouseup', endDrag);
    container.removeEventListener('wheel', handleZoom);

    // Add listeners
    wrapper.addEventListener('mousedown', startDrag);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', endDrag);
    container.addEventListener('wheel', handleZoom);

    // Make sure zoom buttons work
    const zoomInButton = document.getElementById('zoomInButton');
    const zoomOutButton = document.getElementById('zoomOutButton');
    
    if (zoomInButton) {
        zoomInButton.removeEventListener('click', zoomIn);
        zoomInButton.addEventListener('click', zoomIn);
    }
    
    if (zoomOutButton) {
        zoomOutButton.removeEventListener('click', zoomOut);
        zoomOutButton.addEventListener('click', zoomOut);
    }
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
    updateCoordinateDisplay(); 
}

function endDrag(e) {
    if (!isDragging) return;
    isDragging = false;
    const wrapper = document.querySelector('.image-wrapper');
    wrapper.style.cursor = 'grab';
}

function updateImageTransform() {
    const wrapper = document.querySelector('.image-wrapper');
    if (!wrapper) return;

    wrapper.style.transform = `translate(${currentX}px, ${currentY}px) scale(${currentScale})`;
    updateCoordinateDisplay();
}

function zoomIn() {
    const container = document.querySelector('.preview-container');
    const referenceScale = parseFloat(container.dataset.referenceScale);
    currentScale = currentScale * 1.2;  // Increase by 20%
    updateImageTransform();
}

function zoomOut() {
    const container = document.querySelector('.preview-container');
    const referenceScale = parseFloat(container.dataset.referenceScale);
    currentScale = currentScale / 1.2;  // Decrease by 20%
    updateImageTransform();
}

function handleZoom(e) {
    e.preventDefault();
    if (e.deltaY < 0) {
        zoomIn();
    } else {
        zoomOut();
    }
    updateCoordinateDisplay();
}

function setupPreview() {
    const container = document.querySelector('.preview-container');
    
    // Remove any existing indicator first
    const existingIndicator = document.querySelector('.center-indicator');
    if (existingIndicator) {
        existingIndicator.remove();
    }
    
    // Add center indicator
    const indicator = document.createElement('div');
    indicator.className = 'center-indicator';
    container.appendChild(indicator);  // Attach to container
    
    // Set up image load handling
    const previewImage = document.getElementById('previewImage');
    if (previewImage) {
        previewImage.onload = function() {
            fitImageToContainer(this);
            setupImageDragAndZoom();
        };
    }
}

function fitImageToContainer(image) {
    const container = document.querySelector('.preview-container');
    const containerRect = container.getBoundingClientRect();
    
    // Calculate reference scale
    const referenceScale = Math.min(
        containerRect.width / image.naturalWidth,
        containerRect.height / image.naturalHeight
    );
    
    // Store this as our reference
    container.dataset.referenceScale = referenceScale;
    
    // Set scale based on animation type
    const [animationType, animationName] = document.getElementById('animationType').value.split('-');
    if (animationType === 'image' && animationName === 'panzoom' && currentConfig.keyframes?.length > 0) {
        // For panzoom with keyframes, use current scale
        currentScale = currentScale || referenceScale;
    } else {
        // For all other cases, force scale to reference (1.0 normalized)
        currentScale = referenceScale;
        currentX = 0;
        currentY = 0;
    }
    
    updateImageTransform();
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
                <div class="scene-item-content">
                    <div>${scene.id}</div>
                    <button class="delete-button" onclick="event.stopPropagation();">Delete</button>
                </div>
            </div>
        `).join('');

        // Add event listeners
        container.querySelectorAll('.scene-item').forEach(item => {
            item.addEventListener('click', () => {
                loadScene(item.dataset.sceneId);
            });
            
            // Add delete button listener
            const deleteBtn = item.querySelector('.delete-button');
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();  // Prevent scene loading
                deleteScene(item.dataset.sceneId);
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
        
        // Reset config first
        currentConfig = {
            verses: [],
            keyframes: []
        };
        
        // Set animation type
        let animationType = 'image';
        let animationName = '';
        
        if (currentScene.image.animation) {
            animationName = currentScene.image.animation.type;
            console.log('Found image animation:', animationName);
            
            // Load animation config
            if (currentScene.image.animation.config) {
                if (animationName === 'panzoom' && currentScene.image.animation.config.keyframes) {
                    currentConfig.keyframes = JSON.parse(JSON.stringify(currentScene.image.animation.config.keyframes));
                    console.log('Loaded keyframes:', currentConfig.keyframes);
                }
            }
        } else if (currentScene.image.geometry) {
            animationType = 'geometry';
            animationName = currentScene.image.geometry.animation.type;
        }
        
        // Update UI form fields
        document.getElementById('sceneId').value = currentScene.id;
        
        // Set animation type in UI
        const animationSelect = document.getElementById('animationType');
        const animationValue = `${animationType}-${animationName}`;
        console.log('Setting animation type to:', animationValue);
        animationSelect.value = animationValue;
        
        // Update animation UI first - this creates necessary DOM elements
        updateAnimationUI();
        
        // Now safe to update lists
        updateKeyframeList();
        
        // Reset position and scale for non-panzoom animations
        if (!(animationType === 'image' && animationName === 'panzoom' && currentConfig.keyframes?.length > 0)) {
            currentScale = 1.0;
            currentX = 0;
            currentY = 0;
        }
        
        // Load verses
        currentConfig.verses = currentScene.text?.verses || [];
        updateVerseList();
        
        // Load image last, after all UI is set up
        if (currentScene.image && currentScene.image.path) {
            const previewImage = document.getElementById('previewImage');
            previewImage.src = `/assets/images/${currentScene.image.path}`;
            document.getElementById('currentImage').textContent = currentScene.image.path;
        }
        
    } catch (error) {
        console.error('Error loading scene:', error);
    }
}

// Add this function to scene-config.js
async function deleteScene(sceneId) {
    if (!confirm(`Are you sure you want to delete scene "${sceneId}"?`)) {
        return;
    }

    try {
        const response = await fetch(`/api/scenes/${sceneId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            loadSceneList();  // Refresh the list
            
            // If the deleted scene was the current scene, clear the form
            if (currentScene && currentScene.id === sceneId) {
                createNewScene();
            }
            
            alert('Scene deleted successfully!');
        } else {
            alert('Error deleting scene');
        }
    } catch (error) {
        console.error('Error deleting scene:', error);
        alert('Error deleting scene');
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
    
    if (!schema) {
        configContainer.innerHTML = '';
        return;
    }
    
    const configHtml = generateConfigUI(schema.config);
    configContainer.innerHTML = configHtml;
    
    // After generating new HTML, reattach event listeners
    setupConfigEventListeners();
    
    // Specifically handle the capture keyframe button which is dynamically created
    const captureButton = document.getElementById('captureKeyframeButton');
    if (captureButton) {
        captureButton.addEventListener('click', captureKeyframe);
    }
    
    // If this is a panzoom animation, show keyframe controls
    const keyframeControls = document.getElementById('keyframeControls');
    if (keyframeControls && type === 'image' && name === 'panzoom') {
        keyframeControls.style.display = 'block';
    }
}

function setupConfigEventListeners() {
    // Keyframe related listeners
    document.querySelectorAll('.keyframe-item button').forEach((button, index) => {
        button.addEventListener('click', () => removeKeyframe(index));
    });

    document.querySelectorAll('.keyframe-item input').forEach((input, index) => {
        input.addEventListener('change', (e) => updateKeyframeDuration(index, e.target.value));
    });

    // Verse related listeners
    document.querySelectorAll('.verse-container textarea').forEach((textarea, verseIndex) => {
        textarea.addEventListener('change', (e) => updateVerseText(verseIndex, e.target.value));
    });

    document.querySelectorAll('.verse-container button').forEach((button, verseIndex) => {
        button.addEventListener('click', () => removeVerse(verseIndex));
    });

    // Animation config inputs
    document.querySelectorAll('#animationConfig input, #animationConfig select').forEach(element => {
        const id = element.id;
        element.addEventListener('change', (e) => updateConfig(id, e.target.value));
    });
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
                    <button id="captureKeyframeButton">Capture Current View</button>
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
        <div class="verse-container" data-verse-index="${verseIndex}">
            <h4>Verse ${verse.id}</h4>
            <textarea
                class="verse-text"
                rows="6"
                style="width: 100%; margin-bottom: 10px;"
            >${verse.lines.join('\n')}</textarea>
            <button class="remove-verse-button">Remove Verse</button>
        </div>
    `).join('');

    // Attach event listeners
    verseList.querySelectorAll('.verse-text').forEach((textarea, index) => {
        textarea.addEventListener('change', (e) => updateVerseText(index, e.target.value));
    });

    verseList.querySelectorAll('.remove-verse-button').forEach((button, index) => {
        button.addEventListener('click', () => removeVerse(index));
    });
}

function updateVerseText(verseIndex, text) {
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
    const container = wrapper.parentElement;
    const referenceScale = parseFloat(container.dataset.referenceScale);
    
    // Use the same normalization as in updateCoordinateDisplay
    const normalizedScale = currentScale / referenceScale;
    
    const containerRect = container.getBoundingClientRect();
    const wrapperRect = wrapper.getBoundingClientRect();
    
    const containerCenterX = containerRect.left + containerRect.width / 2;
    const containerCenterY = containerRect.top + containerRect.height / 2;
    const imageCenterX = wrapperRect.left + wrapperRect.width / 2;
    const imageCenterY = wrapperRect.top + wrapperRect.height / 2;
    
    const normalizedX = (containerCenterX - imageCenterX) / (wrapperRect.width * normalizedScale);
    const normalizedY = (containerCenterY - imageCenterY) / (wrapperRect.height * normalizedScale);
    
    const keyframe = {
        view: {
            x: normalizedX,
            y: normalizedY,
            scale: normalizedScale,
            duration: 2
        }
    };

    currentConfig.keyframes.push(keyframe);
    updateKeyframeList();
}

function updateKeyframeList() {
    const keyframeList = document.getElementById('keyframeList');
    if (!keyframeList) return; // Exit if element doesn't exist
    
    keyframeList.innerHTML = currentConfig.keyframes.map((keyframe, index) => `
        <div class="keyframe-item" data-keyframe-index="${index}">
            <div>Keyframe ${index + 1}</div>
            <div>Scale: ${keyframe.view.scale.toFixed(2)}</div>
            <div>Position: (${keyframe.view.x.toFixed(2)}, ${keyframe.view.y.toFixed(2)})</div>
            <input 
                type="number" 
                class="keyframe-duration"
                value="${keyframe.view.duration}" 
                step="0.1" 
                style="width: 60px;"> seconds
            <button class="remove-keyframe-button">Remove</button>
        </div>
    `).join('');

    // Attach event listeners
    if (keyframeList.querySelector('.keyframe-duration')) {
        keyframeList.querySelectorAll('.keyframe-duration').forEach((input, index) => {
            input.addEventListener('change', (e) => updateKeyframeDuration(index, e.target.value));
        });

        keyframeList.querySelectorAll('.remove-keyframe-button').forEach((button, index) => {
            button.addEventListener('click', () => removeKeyframe(index));
        });
    }
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
