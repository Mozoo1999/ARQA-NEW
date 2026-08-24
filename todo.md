# ARQA NEW — Mobile & Tablet Delivery TODO

## Review and Architecture
- [x] Identify ARQA-NEW repository and active branch
- [x] Review current web prototype, packages, database scripts, and architecture documentation
- [ ] Define mobile app boundary and backend integration contract

## Cross-platform Application
- [ ] Create Expo mobile application under apps/mobile
- [ ] Configure iPhone, Android, and tablet-safe navigation and layouts
- [ ] Implement shared ARQA design tokens and responsive breakpoints
- [ ] Implement authentication/session boundary
- [ ] Implement operational home/control surface
- [ ] Implement supply/cost-chain workflows using real package logic
- [ ] Implement Arabic command intake screen
- [ ] Implement notification suggestion review screen

## Validation and Delivery
- [ ] Add mobile test and type-check commands
- [ ] Validate iPhone-size, Android-size, and tablet-size layouts
- [ ] Document local setup and platform build commands
- [ ] Verify Android/iOS artifact status explicitly
- [ ] Update README with mobile delivery status
- [ ] Save final repository checkpoint

## Known Constraints to Validate
- [ ] Native APK/AAB availability depends on Expo/EAS credentials and signing configuration
- [ ] iOS archive requires macOS/Xcode or EAS cloud build credentials
- [ ] Existing ARQA-NEW backend/API is not yet a deployed service; mobile app must not claim offline/backend functionality without verification
