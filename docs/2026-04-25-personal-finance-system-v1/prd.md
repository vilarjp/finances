---
title: Personal Finance System V1
slug: personal-finance-system-v1
type: prd
status: approved
created: 2026-04-25
source: prompt
approved: 2026-04-25
approval_note: Human approved the PRD.
---

Status: approved

# Personal Finance System V1

## Summary

Build a responsive web-based personal finance application that can replace the user's current spreadsheet workflow for tracking income, fixed expenses, daily expenses, categories, recurring values, and near-term cash flow. V1 focuses on authenticated access through sign-up and login, a home page for daily and current-month visibility, a spreadsheet-like monthly view with a consistent 5-column table structure, flexible income and expense records that contain one or more values, copy-and-paste support for repeated records, and reusable recurring-value tags that can update current and future linked values automatically.

## Problem

The user currently manages personal finances in a spreadsheet. That workflow provides flexibility, but it requires manual maintenance, has limited mobile ergonomics, and makes reusable concepts such as categories, colors, repeated records, and recurring values difficult to update consistently across occurrences. The new system should preserve the high-level planning benefits of the spreadsheet while making core daily and monthly finance workflows easier to use in a dedicated web app.

## Goals

- Provide a responsive web application that works well on desktop and mobile.
- Support account access through sign-up, login, and logout.
- Provide a home page with daily totals, current-month category breakdowns, current-vs-previous-month balance comparison, and near-term finance tables.
- Provide daily, 3-day, and monthly tables that all use the same 5-column structure: Day, Income, Expenses, Daily, and Balance.
- Provide a one-month-at-a-time monthly table from the first through last day of the selected month.
- Support income and expense records as containers that store one or more values.
- Support individual record values with their own amount, label or description, category, and optional recurring-value tag.
- Support the same container-with-values model for all V1 record groupings, including income records, fixed expense records, and daily expense records.
- Support copy-and-paste of records so repeated income or expense records can be recreated on different days without manual re-entry.
- Support recurring-value tags so edits to a shared recurring value update linked current and future values automatically, never past values.
- Recalculate displayed balances, totals, and charts automatically when relevant data changes.

## Non-goals

- Password reset and password change flows are not part of V1.
- Spreadsheet import is not part of V1 unless explicitly added later.
- Bank account syncing, OFX/CSV imports, open banking integrations, and automatic transaction categorization are not part of V1.
- Multi-currency accounting, investment tracking, debt amortization, invoicing, and tax reporting are not part of V1.
- Shared household collaboration, roles, and permission management beyond a user's own account are not part of V1.
- Native mobile apps are not part of V1; the target is a responsive web app.
- Fully automated calendar recurrence generation is not part of V1 beyond copy/paste and recurring-value tag propagation.
- User-configurable timezone settings are not part of V1; V1 uses GMT-3 for time-based finance rules.

## Users / Use Cases

- A personal finance owner signs up, logs in, logs out, and accesses only their own finance workspace.
- The user opens the home page to understand today's income and expenses.
- The user reviews current-month income and expenses by category.
- The user compares the current month's daily balance against the previous month's daily balance.
- The user checks today's records and the next 2 days of planned income and expenses.
- The user opens a monthly view, navigates between months, edits records and values inline, and sees balances update immediately.
- The user creates a single income record with multiple values such as "Salary 1", "Salary 2", and "Camera sale".
- The user creates a single fixed or daily expense record with multiple values such as "Gas", "Lunch", and "Dinner".
- The user gives each value its own category and recurring-value tag, so one record can represent several categories or recurring concepts.
- The user copies an existing record and pastes it onto another day while preserving the record's values, amounts, descriptions, categories, recurring-value tags, colors, type, and other associated fields.
- The user creates reusable recurring-value tags such as "Salary", "Rent", or "Electricity" and updates the tag value once when current and future linked values should change.
- The user uses a collapsible sidebar to see their name, create a record quickly, navigate between application pages, and log out.

## Requirements

### Authentication

- The application must allow a new user to sign up.
- The application must allow an existing user to log in and log out.
- V1 must not include password reset or password change flows.
- Finance data must be scoped to the authenticated user who owns it.
- Authentication screens must be usable on both desktop and mobile.

### Navigation / Sidebar

- Authenticated application pages must include a collapsible and expandable sidebar.
- The sidebar must show the logged-in user's name.
- The sidebar must include a quick-action button for creating an income or expense record.
- The sidebar must include links to the main application pages.
- The sidebar must include a logout button.
- On mobile, the sidebar must remain accessible without blocking primary page actions when collapsed.

### Data Model / Records and Values

- An income or expense record must be a dated container that stores one or more values.
- Income records, fixed expense records, and daily expense records must all use the same container-with-values model.
- Each record must have an owner, effective date and time, type, and optional record-level description.
- Each expense record must be classified as either a fixed expense record or a daily expense record.
- Each income record may contain multiple income values, such as "Salary 1", "Salary 2", and "Camera sale".
- Each expense record may contain multiple expense values, such as "Gas", "Lunch", and "Dinner".
- Each value must have its own amount and label or description.
- Each value must be able to have its own category.
- Each value must be able to have its own recurring-value tag.
- Each value can be linked to zero or one recurring-value tag.
- A single record can therefore contain multiple categories and multiple recurring-value tags across its values.
- The total amount for a record must be calculated as the sum of its contained values.
- Daily income totals, expense totals, chart totals, and balances must be calculated from values, not from a separate record-level amount.
- Record creation and editing must allow the user to add, edit, and remove values within the record.
- Each income or expense record must support editable font color and background color for table display.
- The interface must make it clear whether an amount edit applies only to one value or to the shared amount on a recurring-value tag.

### Shared Table Structure

- The daily table, the current-day-plus-next-2-days table, and the monthly table must all use the same 5 columns in this order: Day, Income, Expenses, Daily, Balance.
- The Day column must show the calendar day represented by the row.
- The Income column must show income records for that day, including their contained values.
- The Expenses column must show fixed expense records for that day, including their contained values.
- The Daily column must show daily expense records for that day, including their contained values.
- The Balance column must show the calculated balance for that day, derived from income values minus fixed and daily expense values.
- In V1, the Balance column represents that row's daily net amount, not a running account balance across prior days.
- Table cells that contain records must make the record container and its individual values understandable, including each value's label, amount, category, and recurring-value tag where space allows.
- Editing a record or value from any table must automatically recalculate affected rows, summaries, charts, and balances without requiring a manual refresh.

### Home Page

- The home page must default to the current day and current month.
- The home page must update its summaries, charts, and tables when records, values, categories, or recurring-value tags change.

#### Desktop Home Page

- The desktop home page must have 3 primary sections.
- Section 1 must show 2 big-number summary cards: total income for the current day and total expenses for the current day.
- Section 2 must show a pie chart and a line chart side by side.
- The pie chart must show the current month's income and expenses broken down by value category.
- The line chart must compare the current month's daily balance against the previous month's daily balance.
- Section 3 must show 2 tables laid out horizontally in a 30% / 70% split.
- The 30% table must be the daily table for the current day using the shared 5-column structure.
- The 70% table must show the current day plus the next 2 days using the shared 5-column structure.

#### Mobile Home Page

- The mobile home page must have the same 3 primary sections as desktop.
- Section 1 must show the 2 big-number daily summary cards in a carousel.
- Section 2 must show the pie chart and line chart in a carousel.
- Section 3 must show the daily table and the current-day-plus-next-2-days table in a carousel.
- Both mobile tables in Section 3 must use the shared 5-column structure.
- The mobile home page must include a floating action button for quickly creating a new income or expense record.

### Monthly View

- The monthly view must display exactly one selected month at a time.
- The monthly view must include every calendar day from the first day through the last day of the selected month.
- The monthly table must use the shared 5-column structure: Day, Income, Expenses, Daily, and Balance.
- For each day, the Income column must show that day's income records and their contained values.
- For each day, the Expenses column must show that day's fixed expense records and their contained values.
- For each day, the Daily column must show that day's daily expense records and their contained values.
- For each day, the Balance column must show the balance derived from that day's income values minus fixed and daily expense values.
- The user must be able to navigate to the previous and next month.
- Record amounts, value amounts, descriptions, value categories, record colors, category colors, and recurring-value tags must be editable from the monthly workflow.
- The monthly workflow must support copying a record and pasting it onto a different day.
- Edits must automatically recalculate daily balances, home page totals, home page charts, and visible monthly totals without requiring a manual refresh.

### Record Creation And Editing

- The record creation and editing experience must allow the user to create income records and expense records.
- The record creation and editing experience must allow the user to add one or more values to the record.
- The record creation and editing experience must allow each value to have its own amount and label or description.
- The record creation and editing experience must allow each value to have its own category.
- The record creation and editing experience must allow each value to have zero or one recurring-value tag.
- The interface must prevent assigning more than one recurring-value tag to the same value.
- Expense records must support classification as either fixed expenses or daily expenses.
- Records and values must support creation, editing, and deletion.
- When a value is added, removed, or edited, the parent record total must update automatically.
- When all values are removed from a record, the user must either add a value before saving or delete the record.

### Copy / Paste

- The user must be able to copy an existing income or expense record.
- The user must be able to paste a copied record onto a different day.
- Pasting a record onto a target day must preserve all record data except the occurrence date, including type, fixed/daily expense classification, effective time, record description, record colors, and all contained values.
- Pasting must preserve each contained value's amount, label or description, category, recurring-value tag, and any other value-level fields.
- If the copied record has an effective time, the pasted record must preserve that time unless the user changes it.
- After a pasted record is saved, balances, totals, charts, and tables must update automatically.

### Categories

- Categories must be reusable across income and expense values.
- Each category must support editable name, font color, and background color.
- Each value must be able to have zero or one category.
- One record may contain multiple categories because each contained value can have its own category.
- Updating a category's name or colors must update all values that display that category.
- Category grouping must be used by the home page pie chart.
- Chart category totals must be calculated from value amounts. For a record with multiple values, each value must contribute its own amount to its own category.
- Values without a category must be grouped under an uncategorized category in charts and summaries.

### Recurring-Value Tags

- The system must support reusable recurring-value tags for income and expense values.
- A recurring-value tag must represent a shared named recurring value, such as "Salary", "Rent", or "Electricity".
- A value can be linked to zero or one recurring-value tag.
- One record may contain multiple recurring-value tags because each contained value can have its own tag.
- A recurring-value tag must have a name and a stored recurring amount.
- A recurring-value tag can be created while creating or editing a value, using that value's amount as the initial stored recurring amount.
- When a user creates or edits a value and assigns an existing recurring-value tag, the interface must support applying the tag's stored recurring amount to that value.
- Updating a recurring-value tag's stored amount must automatically update all linked values whose parent record effective timestamp is on or after the timestamp when the tag update is saved.
- Updating a recurring-value tag's stored amount must never update linked values whose parent record effective timestamp is before the timestamp when the tag update is saved.
- The current/future cutoff for recurring-value tag propagation must be evaluated as a full date-and-time timestamp in GMT-3.
- In V1, the shared field managed by a recurring-value tag is the stored recurring amount. Value labels, descriptions, categories, record colors, expense grouping, and other fields remain record-specific or value-specific.
- The user must be able to unlink a value from a recurring-value tag when they need a one-off amount that should not be changed by later tag updates.
- When a recurring-value tag update changes one or more linked values, all parent record totals and affected table balances must recalculate automatically.

### Responsive Experience

- The application must be usable on desktop and mobile screens.
- Home page charts, daily tables, and monthly tables must adapt to small screens without requiring horizontal scrolling for primary actions wherever practical.
- Touch targets and editable controls must be usable on mobile.
- The mobile floating action button and collapsed sidebar must not obscure required record, value, chart, or table actions.
- Mobile table cells that cannot show all value details inline must provide a compact expansion or drill-in pattern for viewing and editing contained values.

## Acceptance Criteria

- Given a new visitor, when they complete sign-up successfully, then they can access an authenticated finance workspace.
- Given an existing user, when they log in successfully, then they can access only their own finance data.
- Given an authenticated user, when they use the sidebar logout button, then they are logged out of the application.
- Given a user is on an authenticated page, when the sidebar is expanded, then it shows the user's name, page links, a create-record action, and logout.
- Given a user is on an authenticated page, when the sidebar is collapsed, then page content remains usable and the sidebar can be expanded again.
- Given records exist for the current day, when the user opens the desktop home page, then Section 1 shows big-number cards for today's total income and today's total expenses calculated from values.
- Given records exist for the current month, when the user opens the desktop home page, then Section 2 shows a category pie chart based on value categories alongside a line chart comparing current-month daily balance to previous-month daily balance.
- Given records exist for today and the next 2 days, when the user opens the desktop home page, then Section 3 shows the daily table and the current-day-plus-next-2-days table in a horizontal 30% / 70% layout using Day, Income, Expenses, Daily, and Balance columns.
- Given the application is used on a mobile viewport, when the user opens the home page, then each of the 3 home sections uses a carousel for its paired content.
- Given the application is used on a mobile viewport, when the user taps the floating action button, then they can quickly create an income or expense record.
- Given the user opens the monthly view, when a month is selected, then only that month is displayed from day 1 through the month's final day using Day, Income, Expenses, Daily, and Balance columns.
- Given a day has income records, fixed expense records, and daily expense records, when any table renders, then those records appear in the correct Income, Expenses, or Daily columns and the Balance column is calculated from their contained values.
- Given the user creates or edits an income record, when they add values such as "Salary 1", "Salary 2", and "Camera sale", then the saved record preserves each value and calculates the record total from those values.
- Given the user creates or edits an expense record, when they add values such as "Gas", "Lunch", and "Dinner", then the saved record preserves each value and calculates the record total from those values.
- Given the user creates or edits a value, when they assign a category and one recurring-value tag, then the saved value preserves those fields.
- Given the user tries to assign more than one recurring-value tag to a value, when they save, then the interface prevents the invalid state.
- Given the user edits a value amount, record type, fixed/daily classification, value category, recurring-value tag, description, font color, or background color, when the edit is saved, then all affected totals, balances, tables, and charts recalculate automatically.
- Given the user edits a category's name, font color, or background color, when the edit is saved, then every displayed value using that category reflects the change.
- Given a value has no category, when charts or summaries group values by category, then that value is included under an uncategorized grouping.
- Given a record is copied, when it is pasted onto another day, then the pasted record preserves all source record data and contained value data except the occurrence date.
- Given an existing recurring-value tag such as "Salary" has linked current and future income values, when the user edits the tag amount from "R$ 5.000,00" to a new value, then all linked values whose parent record effective timestamp is on or after the saved update timestamp update to the new amount.
- Given an existing recurring-value tag has linked past values, when the user edits the tag amount, then linked values whose parent record effective timestamp is before the saved update timestamp are not changed.
- Given a value is unlinked from a recurring-value tag, when the recurring-value tag is later edited, then the unlinked value is not changed.
- Given the application is used on a mobile viewport, when the user navigates authentication, home, and monthly workflows, then all primary actions remain readable and usable.

## Success Signals

- The user can stop relying on the spreadsheet for daily and monthly personal finance tracking.
- The user can complete common workflows from a mobile device without switching back to desktop.
- The user can represent multiple income or expense values inside one dated record without losing category or tag specificity.
- The user can create repeated records on different days through copy/paste instead of manual re-entry.
- Updating a category or recurring-value tag no longer requires manually editing each current or future value.
- Home page charts, daily summaries, and tables reflect changes immediately after edits.
- The monthly view remains understandable and performant for a full month of personal finance records.

## Risks / Dependencies

- The record/value model needs clear UI treatment so users understand when they are editing the record container versus an individual value.
- Recurring-value tag propagation depends on storing an effective date and time for each record and applying GMT-3 consistently.
- The recurring-value tag model needs clear user feedback so users understand whether they are editing one value amount or the shared tag value.
- Copy/paste must preserve nested value data reliably while changing only the pasted record occurrence date by default.
- Tables with nested values can become dense on mobile; the design may need compact row expansion or drill-in patterns to remain usable.
- Without import support in V1, the user may need to manually recreate existing spreadsheet data.

## Blocking Questions

None.

## Deferred Non-Blocking Questions

- Should V1 include spreadsheet import or migration tooling? Deferred because the prompt asks to replace the spreadsheet workflow, but does not explicitly require importing historical spreadsheet data.
- Should recurring-value tag updates require a confirmation step before updating current and future linked values? Deferred because the core V1 behavior is clear, but confirmation UX can be finalized during design.
- Should copy/paste support multi-select copying of several records at once, or only one record at a time in V1? Deferred because single-record copy/paste satisfies the stated V1 need.
- Should V1 allow value-level colors in addition to record-level colors? Deferred because V1 requires preserving display colors and category colors, while the exact color inheritance model can be finalized during implementation planning.

## Approval

Approved on 2026-04-25.
