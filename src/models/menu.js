/**
 * Advanced Menu & Catering Planner.
 *
 * Beyond basic catering notes: courses, dishes, dietary mapping to guests,
 * tasting notes, vendor menu versions, and cost per head calculations.
 */

import { createEntity } from './base';

export const CourseType = {
  APPETIZER: 'appetizer',
  SOUP: 'soup',
  SALAD: 'salad',
  MAIN: 'main',
  SIDE: 'side',
  DESSERT: 'dessert',
  CAKE: 'cake',
  LATE_NIGHT: 'late_night',
  BAR: 'bar',
  OTHER: 'other',
};

export const CourseTypeMeta = {
  [CourseType.APPETIZER]: { label: 'Appetizer / Passed', order: 10 },
  [CourseType.SOUP]: { label: 'Soup', order: 20 },
  [CourseType.SALAD]: { label: 'Salad', order: 30 },
  [CourseType.MAIN]: { label: 'Main Course', order: 40 },
  [CourseType.SIDE]: { label: 'Side', order: 50 },
  [CourseType.DESSERT]: { label: 'Dessert', order: 60 },
  [CourseType.CAKE]: { label: 'Wedding Cake', order: 70 },
  [CourseType.LATE_NIGHT]: { label: 'Late Night Snack', order: 80 },
  [CourseType.BAR]: { label: 'Bar / Beverage', order: 90 },
  [CourseType.OTHER]: { label: 'Other', order: 100 },
};

export const DietaryTag = {
  VEGETARIAN: 'vegetarian',
  VEGAN: 'vegan',
  GLUTEN_FREE: 'gluten_free',
  DAIRY_FREE: 'dairy_free',
  NUT_FREE: 'nut_free',
  HALAL: 'halal',
  KOSHER: 'kosher',
  PESCATARIAN: 'pescatarian',
  KIDS: 'kids',
  OTHER: 'other',
};

export const DietaryTagMeta = {
  [DietaryTag.VEGETARIAN]: { label: 'Vegetarian', emoji: '🥬' },
  [DietaryTag.VEGAN]: { label: 'Vegan', emoji: '🌱' },
  [DietaryTag.GLUTEN_FREE]: { label: 'Gluten-free', emoji: '🌾' },
  [DietaryTag.DAIRY_FREE]: { label: 'Dairy-free', emoji: '🥛' },
  [DietaryTag.NUT_FREE]: { label: 'Nut-free', emoji: '🥜' },
  [DietaryTag.HALAL]: { label: 'Halal', emoji: '🕌' },
  [DietaryTag.KOSHER]: { label: 'Kosher', emoji: '✡️' },
  [DietaryTag.PESCATARIAN]: { label: 'Pescatarian', emoji: '🐟' },
  [DietaryTag.KIDS]: { label: 'Kids menu', emoji: '🧒' },
  [DietaryTag.OTHER]: { label: 'Other', emoji: '📝' },
};

export function createMenu(partial = {}) {
  return createEntity({
    weddingId: null,
    vendorId: null,
    title: 'Wedding Menu',
    version: 1,
    notes: '',
    costPerHead: 0,
    currency: 'USD',
    guestCountEstimate: 0,
    isFinal: false,
    ...partial,
  });
}

export function createCourse(partial = {}) {
  return createEntity({
    weddingId: null,
    menuId: null,
    type: CourseType.MAIN,
    title: '',
    description: '',
    sortOrder: 0,
    ...partial,
  });
}

export function createDish(partial = {}) {
  return createEntity({
    weddingId: null,
    courseId: null,
    menuId: null,
    name: '',
    description: '',
    dietaryTags: [],
    allergens: [],
    isChoice: false, // guest chooses among options
    maxChoices: 1,
    costDelta: 0,
    photoUri: null,
    tastingNotes: '',
    ...partial,
  });
}

export function createTastingNote(partial = {}) {
  return createEntity({
    weddingId: null,
    dishId: null,
    menuId: null,
    rating: 0, // 1-5
    notes: '',
    tastedAt: null,
    attendees: [],
    ...partial,
  });
}

export function createDietaryRequirement(partial = {}) {
  return createEntity({
    weddingId: null,
    guestId: null,
    tags: [],
    notes: '',
    confirmed: false,
    ...partial,
  });
}

export function dishesForCourse(courseId, dishes) {
  const list = Array.isArray(dishes) ? dishes : Object.values(dishes?.byId || {});
  return list.filter((d) => d.courseId === courseId);
}

export function estimateMenuCost(menu, guestCount) {
  const perHead = menu?.costPerHead || 0;
  const count = guestCount || menu?.guestCountEstimate || 0;
  return {
    perHead,
    total: Math.round(perHead * count * 100) / 100,
    guestCount: count,
  };
}

export function dietaryCoverage(dishes, requirements) {
  const dishList = Array.isArray(dishes) ? dishes : Object.values(dishes?.byId || {});
  const reqList = Array.isArray(requirements) ? requirements : Object.values(requirements?.byId || {});
  const covered = new Set();
  const gaps = [];
  for (const req of reqList) {
    const tags = req.tags || [];
    const hasMatch = dishList.some((d) =>
      tags.every((t) => (d.dietaryTags || []).includes(t))
    );
    if (hasMatch) covered.add(req.id);
    else gaps.push(req);
  }
  return { coveredCount: covered.size, total: reqList.length, gaps };
}

export function buildSampleMenu(weddingId, vendorId = null) {
  const menu = createMenu({
    weddingId,
    vendorId,
    title: 'Reception Menu',
    costPerHead: 95,
    guestCountEstimate: 120,
  });
  return menu;
}
