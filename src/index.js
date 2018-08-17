// tabs
import Tab from './Tab';

/**
 * @function createTab
 *
 * @description
 * create a new Tab instance based on the configuration object passed
 *
 * @param {Object} [config={}] the configuration object
 * @returns {Tab} the generated tab
 */
const createTab = (config = {}) => new Tab(config, {});

export default createTab;
