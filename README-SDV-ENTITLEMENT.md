# SDV Entitlement Management

## Overview

The SDV (Single Day Vacation) Entitlement feature allows division admins to set the number of single day vacation days allocated to members in their division. Members can split up to two weeks of vacation to obtain a total of 12 SDVs (6 days per week).

## Implementation Details

### Database Field

- The `sdv_entitlement` field has been added to the `members` table in Supabase.
- The field is an integer with a default value of 0.
- Valid values range from 0 to 12.

### User Interface

- Division admins can manage SDV entitlements through the Division Admin Dashboard.
- The SDV Entitlement Manager component allows admins to:
  - View all members in their division
  - Search for specific members
  - Edit SDV entitlement values for members
  - Save changes to the database

### Access Control

- Only users with `division_admin`, `union_admin`, or `application_admin` roles can edit SDV entitlements.
- Regular users can view their SDV entitlement in the "My Time" page.

## Usage

### For Division Admins

1. Navigate to the Division Admin Dashboard
2. Select the "Members" tab
3. Use the SDV Entitlement Manager to edit members' SDV entitlements
4. Click "Save" to apply changes

### For Members

Members can view their SDV entitlement and usage on the "My Time" page, which shows:

- Total SDV days allocated
- Available SDV days remaining
- Requested SDV days (pending approval)
- Waitlisted SDV days
- Approved SDV days
- Paid in lieu SDV days

## Technical Implementation

- The `useMyTime` hook fetches the member's `sdv_entitlement` from their profile.
- The SDV Entitlement Manager component handles the UI for editing entitlements.
- Type definitions in `types/supabase.ts` include the `sdv_entitlement` field.

## Business Rules

- Maximum of 12 SDVs per member (6 per week for 2 weeks).
- SDV days come from splitting regular vacation weeks.
- Division admins determine the SDV allocation during vacation picks for the next year.
