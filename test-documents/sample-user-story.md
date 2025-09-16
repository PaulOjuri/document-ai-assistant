# Sample User Story

## Epic: Mobile Banking Enhancement

### Feature: Quick Balance Check

**User Story**: As a mobile banking customer, I want to quickly check my account balance without logging into the full app, so that I can make informed spending decisions on the go.

**Acceptance Criteria**:
1. **Given** I am on the mobile banking app home screen
   **When** I enable the quick balance widget
   **Then** I should see my current account balance displayed securely

2. **Given** I have Face ID/Touch ID enabled
   **When** I tap the quick balance widget
   **Then** I should authenticate using biometrics and see the balance within 2 seconds

3. **Given** I don't have biometric authentication set up
   **When** I tap the quick balance widget
   **Then** I should be prompted to enter my PIN for security

**INVEST Analysis**:
- ✅ **Independent**: Can be developed and tested independently
- ✅ **Negotiable**: Implementation details can be adjusted based on technical constraints
- ✅ **Valuable**: Provides clear value to customers for quick financial awareness
- ✅ **Estimable**: Team can estimate effort based on similar widget implementations
- ✅ **Small**: Can be completed within one sprint
- ✅ **Testable**: Clear acceptance criteria enable comprehensive testing

**Story Points**: 5
**Priority**: High
**Sprint**: PI 1.2 - Sprint 3

**Definition of Done**:
- [ ] Code implemented and unit tested
- [ ] Security review completed
- [ ] Accessibility testing passed
- [ ] Performance testing shows &lt;2s response time
- [ ] User acceptance testing completed
- [ ] Documentation updated