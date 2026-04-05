# Expo SDK Status Record

Last updated: 2026-04-03
Status: SDK 54 active

## Current state

- Expo SDK: `54.0.33`
- React Native: `0.81.5`
- React: `19.1.0`
- React DOM: `19.1.0`
- TypeScript: `5.9.3`

## Current package set

- `expo` -> `~54.0.33`
- `@expo/metro-runtime` -> `~6.1.2`
- `@react-native-community/datetimepicker` -> `8.4.4`
- `expo-camera` -> `~17.0.10`
- `expo-font` -> `~14.0.11`
- `expo-image-picker` -> `~17.0.10`
- `expo-sqlite` -> `^16.0.10`
- `expo-status-bar` -> `~3.0.9`
- `react-native-svg` -> `^15.12.1`
- `@types/react` -> `~19.1.17`
- `babel-preset-expo` -> `~54.0.10`

## Validation

- `npx expo-doctor`: passed
- `pnpm verify:mobile`: passed

## Notes

- The project was temporarily upgraded to SDK 55.0.11, then intentionally rolled back to SDK 54.
- `expo-font` remains installed because `@expo/vector-icons` requires it.
- If SDK 55 is revisited later, start again from this SDK 54 baseline.
