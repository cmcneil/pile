export class LineArtGeometry {
    static type = 'lineart';
    
    constructor(data) {
        if (!data.levels) {
            throw new Error('LineArt geometry data must contain levels array');
        }
        this.levels = data.levels;
        this.validateData();
    }

    // Validation specific to LineArt format
    validateData() {
        if (!Array.isArray(this.levels)) {
            throw new Error('LineArt geometry data must contain levels array');
        }
        
        this.levels.forEach((level, i) => {
            if (!Array.isArray(level)) {
                throw new Error(`Level ${i} must be an array`);
            }

            level.forEach((segment, j) => {
                const valid = segment && 
                    typeof segment === 'object' &&
                    segment.start && segment.end &&
                    typeof segment.start.x === 'number' &&
                    typeof segment.start.y === 'number' &&
                    typeof segment.end.x === 'number' &&
                    typeof segment.end.y === 'number';

                if (!valid) {
                    console.error('Invalid segment:', segment);
                    throw new Error(`Invalid segment at level ${i}, index ${j}`);
                }
            });
        });
    }

    getTotalSegments() {
        return this.levels.reduce((sum, level) => sum + level.length, 0);
    }

    getSegmentAt(globalIndex) {
        let remainingIndex = globalIndex;
        for (let level = 0; level < this.levels.length; level++) {
            if (remainingIndex < this.levels[level].length) {
                return {
                    segment: this.levels[level][remainingIndex],
                    level
                };
            }
            remainingIndex -= this.levels[level].length;
        }
        throw new Error('Segment index out of bounds');
    }
}