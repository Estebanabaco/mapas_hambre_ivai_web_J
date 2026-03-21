import { state, COLOMBIA_CENTER, INITIAL_ZOOM } from '../src/core/store.js';
import { getDomRegistry } from '../src/core/dom-registry.js';

let dom = getDomRegistry();

export let indicatorSelector;
export let storyBox;
export let selectCompareVul;
export let selectCompareNut;
export let aboutBtn;
export let aboutModal;
export let closeModalBtn;
export let appFooter;
export let tabs;
export let tabButtons;
export let selectEvolutionMetric;
export let selectEvolutionCompareYear;
export let labelEvolutionBaseYear;
export let labelEvMapBase;
export let labelEvMapCompare;

export function refreshDomBindings(root = null) {
    dom = getDomRegistry(root || state.domRoot || document);
    indicatorSelector = dom.indicatorSelector;
    storyBox = dom.storyBox;
    selectCompareVul = dom.selectCompareVul;
    selectCompareNut = dom.selectCompareNut;
    aboutBtn = dom.aboutBtn;
    aboutModal = dom.aboutModal;
    closeModalBtn = dom.closeModalBtn;
    appFooter = dom.appFooter;
    tabs = dom.tabs;
    tabButtons = dom.tabButtons;
    selectEvolutionMetric = dom.selectEvolutionMetric;
    selectEvolutionCompareYear = dom.selectEvolutionCompareYear;
    labelEvolutionBaseYear = dom.labelEvolutionBaseYear;
    labelEvMapBase = dom.labelEvMapBase;
    labelEvMapCompare = dom.labelEvMapCompare;
}

refreshDomBindings();

export { state, COLOMBIA_CENTER, INITIAL_ZOOM };
