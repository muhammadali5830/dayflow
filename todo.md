# Project TODO

- [x] Establish the DayFlow visual system: elegant editorial typography, warm neutral canvas, indigo-violet accent, soft cards, and responsive planner layout
- [x] Add onboarding form for wake/sleep times, work or study commitments, exercise, meals, goals, and planning constraints
- [x] Add personalized time-blocked daily timeline with fixed and flexible activity states
- [x] Add quick-add flow for unplanned events and schedule changes with start/end times
- [x] Add automatic replanning that preserves fixed commitments and moves flexible activities around new events
- [x] Persist routine preferences, events, and generated schedule for returning users
- [x] Add graceful loading, empty, success, and error states
- [x] Add Vitest coverage for schedule generation and replanning behavior
- [x] Run typecheck, tests, and visual verification
- [x] Save the final project checkpoint

## History

- DayFlow project initialized from the full-stack web template.

## Verification follow-ups

- [x] Connect planner data to database-backed user persistence via Drizzle and tRPC
- [x] Generate the timeline from onboarding inputs instead of relying only on defaults
- [x] Validate quick-add fields and normalize event times consistently
- [x] Replan flexible blocks into the next available non-colliding windows
- [x] Add explicit empty and error recovery states for planner flows
- [x] Expand Vitest coverage for generation and multi-block replanning edge cases
- [x] Save a final verified checkpoint after the follow-ups are complete
