// tabs
import TabTalk from './TabTalk';

/**
 * @function createTab
 *
 * @description
 * create a new Tab instance based on the configuration object passed
 *
 * @param {Object} [config={}] the configuration object
 * @returns {Tab} the generated tab
 */
const createTab = (config = {}) => new TabTalk(config, {});

export default createTab;
