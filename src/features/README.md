# WeddingGPT Extended Features (40 New Modules)

This directory contains **40 new feature modules** added to WeddingGPT **without modifying or deleting any existing files**.

## Features Included

1. VenueFinder
2. FloristManager
3. CakeDesigner
4. InvitationStudio
5. GiftRegistryPro
6. HoneymoonPlannerAdvanced
7. PhotoBoothManager
8. DanceFloorCoordinator
9. MenuTastingScheduler
10. VendorContractTracker
11. WeatherContingency
12. CulturalTraditionGuide
13. SpeechWriterAI
14. SeatingChartAI
15. TimelineOptimizer
16. GuestTransportation
17. AccommodationManager
18. KidsEntertainment
19. PetInclusionPlanner
20. SustainabilityTracker
21. BudgetForecastAI
22. RSVPAnalytics
23. PhotoAlbumCollaborator
24. MusicPlaylistAI
25. DecorVisualizer
26. MakeupHairScheduler
27. LegalDocuments
28. NameChangeHelper
29. PostWeddingTasks
30. AnniversaryPlanner
31. VirtualWeddingSupport
32. LiveStreamingManager
33. GuestExperienceSurvey
34. VendorReviewAggregator
35. CostComparisonEngine
36. ThemeMoodboard
37. CeremonyScriptBuilder
38. ReceptionFlowDesigner
39. EmergencyKitPlanner
40. MemoryBookGenerator

## Structure per Feature (18 modules each)

Each feature directory contains:

- `index.js` - Module exports
- `store.js` - Zustand store with persist
- `types.js` - Type definitions / JSDoc
- `constants.js` - Statuses, priorities, categories
- `validators.js` - Input validation & sanitization
- `services/api.js` - CRUD API (AsyncStorage backed)
- `services/localStorage.js` - Prefs & key helpers
- `utils/helpers.js` - Formatters, filters, sort, progress
- `utils/formatters.js` - Summary & share text
- `hooks/useFeature.js` - Primary React hook
- `hooks/useFeatureList.js` - Multi-select list hook
- `components/FeatureList.jsx`
- `components/FeatureCard.jsx`
- `components/FeatureForm.jsx`
- `components/FeatureDetail.jsx`
- `components/EmptyState.jsx`
- `screens/MainScreen.jsx`
- `screens/DetailScreen.jsx`

## Integration

Import from `src/features` or individual feature:

```js
import { VenueFinder, EXTENDED_FEATURES, FEATURE_COUNT } from '../features';
import useVenueFinder from '../features/VenueFinder/hooks/useFeature';
```

All existing code remains untouched.
