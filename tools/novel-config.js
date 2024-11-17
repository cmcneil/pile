let currentNovel = {
    scenes: []
};

document.addEventListener('DOMContentLoaded', () => {
    loadNovelList();
    loadAvailableScenes();
});

async function loadNovelList() {
    try {
        const response = await fetch('/api/novels');
        const novels = await response.json();
        const container = document.getElementById('novelListContainer');
        
        container.innerHTML = novels.map(novel => `
            <div class="novel-item" onclick="loadNovel('${novel.id}')">
                <div>${novel.title}</div>
                <div><small>${novel.scenes.length} scenes</small></div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading novels:', error);
    }
}

async function loadNovel(novelId) {
    try {
        const response = await fetch(`/api/novels/${novelId}`);
        currentNovel = await response.json();
        
        document.getElementById('novelId').value = currentNovel.id;
        document.getElementById('novelTitle').value = currentNovel.title;
        updateSequenceDisplay();
    } catch (error) {
        console.error('Error loading novel:', error);
    }
}

async function loadAvailableScenes() {
    try {
        const response = await fetch('/api/scenes');
        const scenes = await response.json();
        const container = document.getElementById('scenePool');
        
        container.innerHTML = scenes.map(scene => `
            <div class="scene-item" 
                 onclick="addToSequence('${scene.id}')"
                 data-scene-id="${scene.id}">
                ${scene.id}
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading scenes:', error);
    }
}

function updateSequenceDisplay() {
    const container = document.getElementById('sceneSequence');
    
    container.innerHTML = currentNovel.scenes.map((sceneId, index) => `
        <div class="sequence-item">
            <span>${index + 1}. ${sceneId}</span>
            <button onclick="removeFromSequence(${index})">Remove</button>
            <button onclick="moveUp(${index})" ${index === 0 ? 'disabled' : ''}>↑</button>
            <button onclick="moveDown(${index})" ${index === currentNovel.scenes.length - 1 ? 'disabled' : ''}>↓</button>
        </div>
    `).join('');
}

function addToSequence(sceneId) {
    currentNovel.scenes.push(sceneId);
    updateSequenceDisplay();
}

function removeFromSequence(index) {
    currentNovel.scenes.splice(index, 1);
    updateSequenceDisplay();
}

function moveUp(index) {
    if (index > 0) {
        const temp = currentNovel.scenes[index];
        currentNovel.scenes[index] = currentNovel.scenes[index - 1];
        currentNovel.scenes[index - 1] = temp;
        updateSequenceDisplay();
    }
}

function moveDown(index) {
    if (index < currentNovel.scenes.length - 1) {
        const temp = currentNovel.scenes[index];
        currentNovel.scenes[index] = currentNovel.scenes[index + 1];
        currentNovel.scenes[index + 1] = temp;
        updateSequenceDisplay();
    }
}

function createNewNovel() {
    currentNovel = {
        id: '',
        title: '',
        scenes: []
    };
    document.getElementById('novelId').value = '';
    document.getElementById('novelTitle').value = '';
    updateSequenceDisplay();
}

async function saveNovel() {
    currentNovel.id = document.getElementById('novelId').value;
    currentNovel.title = document.getElementById('novelTitle').value;

    try {
        const response = await fetch('/api/novels', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(currentNovel)
        });
        
        if (response.ok) {
            loadNovelList();
            alert('Novel saved successfully!');
        }
    } catch (error) {
        console.error('Error saving novel:', error);
    }
}