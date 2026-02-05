/**
 * PSALMIST_NINJA // LMS_CORE_V5
 * Centralized Logic for Conservatory Accreditation & XP Management
 */

const LMS = {
    // Standardized Grade Titles for UI consistency
    gradeTitles: [
        "THE_TACTUS", "SIMPLE_SUBDIVISION", "TERNARY_GROUPING", 
        "THE_ANACRUSIS", "SYNCOPATION", "COMPOUND_METERS", 
        "PARADIDDLES", "CROSS_RHYTHMS", "ASYMMETRIC_METERS", 
        "THE_HEMIOLA", "MICRO_SUBDIVISIONS", "METRIC_MODULATION"
    ],

    // Data Structure
    profile: {
        name: localStorage.getItem('ninjaUser') || "GUEST_OPERATOR",
        xp: parseInt(localStorage.getItem('totalXP')) || 0,
        level: parseInt(localStorage.getItem('currentLevel')) || 1,
        stats: JSON.parse(localStorage.getItem('ninjaStats')) || { reading: 0, timing: 0, ident: 0 }
    },

    /**
     * Awards XP and updates specific skill metrics
     * @param {string} category - 'reading', 'timing', or 'ident'
     * @param {number} amount - XP value to add
     */
    award: function(category, amount) {
        this.profile.xp += amount;
        if (this.profile.stats[category] !== undefined) {
            this.profile.stats[category] += amount;
        }

        this.save();
        console.log(`[LMS] +${amount} XP awarded to ${category}. Total: ${this.profile.xp}`);
        
        // Dispatch event for UI updates (like HUDs)
        window.dispatchEvent(new CustomEvent('xpUpdate', { detail: this.profile }));
    },

    /**
     * Promotes the user to the next Grade
     * Usually called by grade_exam.html upon success
     */
    promote: function() {
        if (this.profile.level < 12) {
            this.profile.level++;
            this.save();
            return true;
        }
        return false;
    },

    /**
     * Logic for the Daily Challenge
     * Returns a difficulty multiplier based on Grade
     */
    getChallengeConfig: function() {
        return {
            grade: this.profile.level,
            title: this.gradeTitles[this.profile.level - 1],
            multiplier: 1 + (this.profile.level * 0.1),
            bpm: 60 + (this.profile.level * 5)
        };
    },

    save: function() {
        localStorage.setItem('totalXP', this.profile.xp);
        localStorage.setItem('currentLevel', this.profile.level);
        localStorage.setItem('ninjaStats', JSON.stringify(this.profile.stats));
    }
};

// Auto-Sync HUDs if they exist on the page
window.addEventListener('xpUpdate', (e) => {
    const xpDisplay = document.getElementById('display-xp');
    const lvlDisplay = document.getElementById('display-level');
    
    if (xpDisplay) xpDisplay.innerText = e.detail.xp.toLocaleString() + " XP";
    if (lvlDisplay) lvlDisplay.innerText = "GRADE_" + e.detail.level.toString().padStart(2, '0');
});