import { state, COLOMBIA_CENTER, INITIAL_ZOOM } from '../src/core/store.js';
import { getDomRegistry } from '../src/core/dom-registry.js';

const dom = getDomRegistry();

export { state, COLOMBIA_CENTER, INITIAL_ZOOM };

export const indicatorSelector = dom.indicatorSelector;
export const storyBox = dom.storyBox;
export const selectCompareVul = dom.selectCompareVul;
export const selectCompareNut = dom.selectCompareNut;
export const aboutBtn = dom.aboutBtn;
export const aboutModal = dom.aboutModal;
export const closeModalBtn = dom.closeModalBtn;
export const appFooter = dom.appFooter;
export const tabs = dom.tabs;
export const tabButtons = dom.tabButtons;
export const selectEvolutionMetric = dom.selectEvolutionMetric;
export const selectEvolutionCompareYear = dom.selectEvolutionCompareYear;
export const labelEvolutionBaseYear = dom.labelEvolutionBaseYear;
export const labelEvMapBase = dom.labelEvMapBase;
export const labelEvMapCompare = dom.labelEvMapCompare;
