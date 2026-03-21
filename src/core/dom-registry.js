function getById(root, id) {
    if (!root) return null;
    if (typeof root.getElementById === 'function') {
        return root.getElementById(id);
    }
    if (typeof root.querySelector === 'function') {
        return root.querySelector(`#${id}`);
    }
    return null;
}

export function getDomRegistry(root = document) {
    return {
        indicatorSelector: getById(root, 'indicator-selector'),
        storyBox: getById(root, 'story-box'),
        selectCompareVul: getById(root, 'select-compare-vul'),
        selectCompareNut: getById(root, 'select-compare-nut'),
        aboutBtn: getById(root, 'about-btn'),
        aboutModal: getById(root, 'about-modal'),
        closeModalBtn: root.querySelector ? root.querySelector('.close-button') : null,
        appFooter: root.querySelector ? root.querySelector('.app-footer') : null,
        tabs: {
            vulnerability: getById(root, 'tab-vulnerability'),
            compare: getById(root, 'tab-compare'),
            evolution: getById(root, 'tab-evolution'),
        },
        tabButtons: {
            vulnerability: getById(root, 'btn-tab-main'),
            compare: getById(root, 'btn-tab-compare'),
            evolution: getById(root, 'btn-tab-evolution'),
        },
        selectEvolutionMetric: getById(root, 'select-evolution-metric'),
        selectEvolutionCompareYear: getById(root, 'select-evolution-compare-year'),
        labelEvolutionBaseYear: getById(root, 'label-evolution-base-year'),
        labelEvMapBase: getById(root, 'label-ev-map-base'),
        labelEvMapCompare: getById(root, 'label-ev-map-compare'),
    };
}
