# Active Context: Moneyflow

## Current Status
The project has successfully implemented a **Project-Based Architecture** with optimized money flow. Users can now collaborate in groups, manage shared expenses, and see efficient settlement plans. The system is stabilized and simplified.

## Current Focus
- **Final Polish & Handover**: Ensuring all collaborative features work as intended.

## Recent Decisions
- **Soft Removal for Participants**: Users who leave a project are marked as `is_active = False` instead of being deleted. They remain selectable for historical records and are displayed as "(removed)" in the UI.
- **Participation-Based Visibility**: Analytics, search, and project lists strictly exclude projects where the user is no longer an *active* participant.
- **Project Equality**: All participants in a project have full management rights (updating details, adding/removing members).
- **Optimized Money Flow**: Implemented a greedy settlement algorithm to minimize transactions and simplify multi-user debt chains.
- **Automatic Deletion**: Projects are automatically deleted when the last active participant leaves.

## Next Steps
- Verify the optimized settlement logic with complex multi-user scenarios.
- Final validation of the project-scoped analytics filtering.

## Active Considerations
- **Historical Consistency**: Maintaining name resolution for former participants in the Purchase Editor without allowing them to be added to new transactions.
- **Migration Cleanliness**: Ensuring the "Legacy Project" transition remains seamless for old data.
