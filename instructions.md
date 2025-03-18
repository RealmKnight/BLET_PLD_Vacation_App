# Project Overview

You are building an Expo react native app for Android, IOS, and web where BLET Union members can request scheduling of their Personal Leave Days (PLDs) and Single Vacation Days (SVDs) and also in the future manage their week-long vacation bids as well.

You will be using Expo SDK 52, react native, NativeWind for styling, shadcn/ui inspired react-native-reusables, self-hosted supabase (for authentication, RBAC, File Storage, etc), and a coolify deployment server

# Core Functionalities

1. Role Based Access Control (RBAC) - User Roles are as follows;
   Application Admin - will be able to do all functions in the app and will have access to an app application dashboard to administer necessary functions.
   Union Admin - will be able to administer all upper level Union functions like adding/removing Divisions from the Union dashboard and all functions of Division Admins and users.
   Division Admin - will be able to administer all functions within the particular division there are assigned an admin of and will have a dashboard for doing so and will be able to acess everything a user can.
   Company Admin - will ONLY have access to company dashboard and will enter requests from the app to company program and mark requests in the app completed when done. They will receive both scheduling and cancelations. Priority will be given to those requests closest to the current day. Will not have a user dashboard nor access to user areas.
   users - will have acess to personal profile to edit/update information and can requests days to be scheduled and weeks for vacation using the calendars for the division they are a member of
   <https://supabase.com/docs/guides/database/postgres/custom-claims-and-role-based-access-control-rbac#create-auth-hook-to-apply-user-role>
   <https://supabase.com/docs/guides/storage/schema/custom-roles>
   <https://supabase.com/docs/guides/auth/auth-hooks#local-development>

2. Divisions - these are the following divisions in the CN/WC GCA of the BLET
   163 - Proctor, MN
   173 - Fon Du Lac, WI
   174 - Stevens Point, WI
   175 - Neenah, WI
   184 - Schiller Park, IL
   185 - Gladstone, MI
   188 - Superior, WI
   209 - Green Bay, WI
   520 - Joliet, IL

3. Division Officers - Following division officer positions can be assigned by the Division Admin
   President (Required)
   Vice-President (Required)
   Secretary/Treasurer (Required)
   Alternate Secretary/Treasurer (Required)
   Legislative Representative (Required)
   Alternate Legislatvie Representative (Required)
   Local Chairman (Required)
   First Vice-Local Chairman (Required)
   Second Vice-Local Chairman (Required)
   Third Vice-Local Chairman
   Forth Vice-Local Chairman
   Fifth Vice-Local Chairman
   Guide (Required)
   Chaplain (Required)
   Delegate to the National Division (Required)
   First Alternate Delegate to the National Division (Required)
   Second Alternate Delegate to the National Division (Required)
   First Trustee (Required)
   Second Trustee (Required)
   Third Trustee (Required)
   First Alternate Trustee (Required)
   Second Alternate Trustee (Required)
   Third Alternate Trustee (Required)

4. Calendars
   Each Division will have 2 seperate calendars one for PLDs/SDVs and one for full week vacations.
   The PLD/SDV Calendar will have several views available (week, Day, Month, etc) and each days will display the number of spots available to be scheduled on that day or "waitlist" if the day is currenlty fully scheduled. The daily allotment of spots available will be administered by the division admin in the division dashboard
   The full week vacation calendar will be similar to the PLD/SDV calendar except that it will not have a daily view

5. My Time
   Each member will have a tab called "My Time" that displays the number of PLDs and SDVs with a table rows as follows - Total, Available, Requested, Waitlisted, Approved, Paid in Lieu. below this chart will be a list of Approved Requests with Submission timestamp, Requested Date, Time off type, and approved timestamp columns (Displaying "No Requests currently approved" if the member has none). Below this will be a list of Time off requests with submission timestamp, requested Date, Time off type columns (Displaying "You have no Requests submitted" if the member has none). Below that will be a list of Waitlisted Requests with Requested date, waitlist position, and time off type columns (Displaying "You aren't on any waitlists" if the member has none).

6. News/Notifications
   There will be a News/Notifications section where Union Admins and Division Admins can post News for members. Some of these news/Notifications will be "Must Read" items and must be read/acknowledged before the member can continue to a different section in the app. A member will always be able to go to their Notifications/News area and read past notices/News though. News/Notifications can be sent just to members of a particular division by the Division Admin or they can be sent to the whole membership by a Union Admin. Division Admins can also message other division Admins and Union Admins as needed. A user can also message the Division Admin of the division they are assigned to. The person who makes the news notiification can set a display date and timeframe for the message to last.

7.

# Doc

xxxx

# Curent file structure

xxxx
