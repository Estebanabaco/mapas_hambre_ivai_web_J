export function getDomRegistry() {
    return {
        indicatorSelector: document.getElementById('indicator-selector'),
        storyBox: document.getElementById('story-box'),
        selectCompareVul: document.getElementById('select-compare-vul'),
        selectCompareNut: document.getElementById('select-compare-nut'),
        aboutBtn: document.getElementById('about-btn'),
        aboutModal: document.getElementById('about-modal'),
        closeModalBtn: document.querySelector('.close-button'),
        appFooter: document.querySelector('.app-footer'),
        tabs: {
            vulnerability: document.getElementById('tab-vulnerability'),
            compare: document.getElementById('tab-compare'),
            evolution: document.getElementById('tab-evolution'),
        },
        tabButtons: {
            vulnerability: document.getElementById('btn-tab-main'),
            compare: document.getElementById('btn-tab-compare'),
            evolution: document.getElementById('btn-tab-evolution'),
        },
        selectEvolutionMetric: document.getElementById('select-evolution-metric'),
        selectEvolutionCompareYear: document.getElementById('select-evolution-compare-year'),
        labelEvolutionBaseYear: document.getElementById('label-evolution-base-year'),
        labelEvMapBase: document.getElementById('label-ev-map-base'),
        labelEvMapCompare: document.getElementById('label-ev-map-compare'),
    };
}
