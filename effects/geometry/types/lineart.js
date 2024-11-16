export class LineArtGeometry {
    constructor(data) {
        if (!data.levels) {
            throw new Error('Geometry data must contain levels array');
        }
        this.levels = data.levels;
        this.validateData();
    }

    validateData() {
        if (!Array.isArray(this.levels)) {
            throw new Error('Geometry data must contain levels array');
        }
        
        this.levels.forEach((level, i) => {
            if (!Array.isArray(level)) {
                throw new Error(`Level ${i} must be an array`);
            }

            // Log the first segment of each level for debugging
            if (level.length > 0) {
                console.log(`Sample segment from level ${i}:`, level[0]);
            }

            level.forEach((segment, j) => {
                // More permissive validation
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