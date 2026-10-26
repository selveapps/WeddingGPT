/**
 * Types / JSDoc for DecorVisualizer
 * @typedef {Object} DecorVisualizerItem
 * @property {string} id
 * @property {string} name
 * @property {string} [description]
 * @property {'pending'|'active'|'completed'|'cancelled'|'archived'} status
 * @property {number} [priority]
 * @property {number} [budget]
 * @property {string} [date]
 * @property {string} [notes]
 * @property {string[]} [tags]
 * @property {string} createdAt
 * @property {string} updatedAt
 */
export const DecorVisualizerItemShape = { id: 'string', name: 'string', status: 'enum', priority: 'number?', budget: 'number?' };
export default { DecorVisualizerItemShape };
