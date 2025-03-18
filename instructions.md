# **Project Requirements Document (PRD)**

## **Project Overview**

You are building an Expo React Native application for **Android, iOS, and web** that enables **BLET Union members** to request scheduling for **Personal Leave Days (PLDs)** and **Single Vacation Days (SVDs)**. Future iterations will include managing **week-long vacation bids** and expanding to support website functionality.

## **Technology Stack**

- **Framework**: Expo SDK 52, React Native
- **Styling**: NativeWind
- **UI Components**: Shadcn/ui-inspired react-native-reusables
- **Backend**: Self-hosted Supabase (Authentication, RBAC, File Storage)
- **Deployment**: Coolify

---

## **Core Functionalities**

### **1. Role-Based Access Control (RBAC)**

User roles and permissions are strictly defined and stored in the **Supabase members table** (not overriding built-in auth roles). A Supabase hook will automatically assign **new members as users**.

| Role                  | Permissions                                                                                        |
| --------------------- | -------------------------------------------------------------------------------------------------- |
| **Application Admin** | Full access to all functions, including administrative dashboard controls.                         |
| **Union Admin**       | Manages union-level functions, including adding/removing divisions and overseeing division admins. |
| **Division Admin**    | Administers a specific division, including managing schedules, user roles, and approvals.          |
| **Company Admin**     | Processes and marks leave requests as completed. Only accesses company dashboard, not user areas.  |
| **User**              | Can edit their profile, submit requests for PLDs, SVDs, and week-long vacation scheduling.         |

> **Implementation Notes:**
>
> - Roles are stored in the **Supabase members table**.
> - A Supabase auth hook will automatically assign **new members** as users.
> - Roles do not override **Supabase’s built-in auth roles**.

### **2. Divisions**

The **CN/WC GCA of the BLET** includes the following divisions:

- **163** - Proctor, MN
- **173** - Fond Du Lac, WI
- **174** - Stevens Point, WI
- **175** - Neenah, WI
- **184** - Schiller Park, IL
- **185** - Gladstone, MI
- **188** - Superior, WI
- **209** - Green Bay, WI
- **520** - Joliet, IL

> **Implementation Notes:**
>
> - Each user is assigned to a **single division**.
> - Each division has **its own set of officers and calendars**.

### **3. Division Officers**

Each division may assign the following **officer positions**, managed by the **Division Admin**:

- **Required Positions:** President, Vice-President, Secretary/Treasurer, Alternate Secretary/Treasurer, Legislative Representative, Alternate Legislative Representative, Local Chairman, First Vice-Local Chairman, Second Vice-Local Chairman, Guide, Chaplain, Delegate to the National Division, First Alternate Delegate to the National Division, Second Alternate Delegate to the National Division, First Trustee, Second Trustee, Third Trustee, First Alternate Trustee, Second Alternate Trustee, Third Alternate Trustee.
- **Optional Positions:** Third Vice-Local Chairman, Fourth Vice-Local Chairman, Fifth Vice-Local Chairman.

> **Implementation Notes:**
>
> - Officer roles will be stored in the **members table**.
> - Assignments are managed in the **Division Admin dashboard**.

### **4. Calendars**

#### **PLD/SDV Calendar**

Each division maintains a **Personal Leave Day (PLD) and Single Vacation Day (SVD) Calendar**, displaying availability with **color-coded status**:

- **Grey** - Past dates (not selectable).
- **Red** - Next 2 days (requests locked).
- **Green** - Future dates (open for requests, 2+ spots available).
- **Yellow** - Limited availability (1-2 spots left).
- **Red** - Fully booked, waitlist option available.

> **Implementation Notes:**
>
> - **Daily availability quotas** are managed by **Division Admins**.
> - Users can submit **waitlist requests** for fully booked days.

#### **Full-Week Vacation Calendar**

- Users **submit vacation preferences** through the app.
- **Auto-scheduling** fills available slots until **Division Admin approval**.
- Vacation follows **seniority-based assignment** rules.
- Vacation periods can **span across years** (e.g., December 30 - January 5).

> **Implementation Notes:**
>
> - Admins can override **automatic scheduling**.
> - Division Admins manage **final vacation approvals**.

### **5. My Time**

Each user has a **"My Time" dashboard** displaying:

- **PLD/SVD Balance**: Total, Available, Requested, Waitlisted, Approved, Paid in Lieu.
- **Approved Requests List**: Submission timestamp, Requested Date, Type, Approval timestamp.
- **Pending Requests List**: Submission timestamp, Requested Date, Type.
- **Waitlisted Requests**: Position, Date, Type.

> **Implementation Notes:**
>
> - Data is fetched from **Supabase tables** for live tracking.

### **6. News & Notifications**

Admins can post **news updates & notifications**:

- **Union Admins** can send to **all members**.
- **Division Admins** can send to their **division members**.
- **Admins can communicate privately**.
- Some messages require **acknowledgment** before users can continue.

> **Implementation Notes:**
>
> - Messages have **start/end display dates**.

### **7. Future Expansion**

Planned **website integration**:

- Forms
- Tools
- Links
- Additional union resources

---

## **File Structure**

```
├──.expo
│ ├──types
│ └──web
│ └──cache
├── app
│ ├── (tabs) # Main tab-based navigation
│ │ ├── index.tsx # Home Screen (default route)
│ │ ├── calendar.tsx # PLD/SDV & Vacation Calendar
│ │ ├── my-time.tsx # User's Time Off Overview
│ │ ├── notifications.tsx # News/Notifications
│ │ ├── profile.tsx # User Profile
│ │ ├── admin # Admin Dashboard (nested routes)
│ │ │ ├── index.tsx # Admin Dashboard Home
│ │ │ ├── division.tsx # Division Management
│ │ │ ├── requests.tsx # Requests Management
│ │ │ └── users.tsx # User Management
│ │ ├── auth # Authentication & Onboarding
│ │ │ ├── login.tsx
│ │ │ ├── register.tsx
│ │ │ └── forgot-password.tsx
│ │ ├── settings.tsx # App Settings
│ │ └── (modals) # Modals for actions (optional)
│ ├── request-modal.tsx # Request Leave Modal
│ ├── notification-modal.tsx # View News Details
│ ├── admin-action-modal.tsx # Admin Approval Modal
├── components # Reusable UI Components
│ ├── ui # Shared UI Elements (Buttons, Modals, Inputs, etc.)
│ ├── calendar # Custom Calendar Components
│ ├── my-time # My Time Dashboard Components
│ ├── notifications # Notification Components
│ └── admin # Admin-Specific UI Components
├── services # API Calls & Business Logic
│ ├── auth.ts # Authentication API
│ ├── calendar.ts # Calendar API
│ ├── requests.ts # Leave Requests API
│ ├── notifications.ts # Notifications API
│ ├── user.ts # User Profile API
│ ├── admin.ts # Admin Functions API
├── store # State Management (if needed)
│ ├── index.ts # Store Initialization
│ ├── authStore.ts # Auth State Management
│ ├── calendarStore.ts # Calendar State Management
│ ├── requestStore.ts # Leave Requests State
│ ├── notificationStore.ts # Notifications State
├── constants # App-Wide Constants & Config
│ ├── roles.ts # Role-Based Access Constants
│ ├── colors.ts # Color Scheme (Calendar Colors, UI Theme)
│ ├── api.ts # API Endpoints
│ ├── permissions.ts # User Permissions
├── hooks # Custom Hooks
│ ├── useAuth.ts # Auth Hook
│ ├── useCalendar.ts # Calendar Hook
│ ├── useNotifications.ts # Notification Hook
│ ├── useRequests.ts # Leave Requests Hook
├── assets # Static Assets
│ ├── fonts
│ ├── images
│ ├── icons
├── scripts # Utility Scripts
│ ├── seedDatabase.ts # Seed Supabase Data
│ ├── syncRoles.ts # Sync RBAC Roles
│ ├── cronJobs.ts # Future Task Automation
├── app.config.ts # Expo App Configuration
└── README.md
```

---

## **Documentation & References**

- [Supabase Custom Claims & RBAC](https://supabase.com/docs/guides/database/postgres/custom-claims-and-role-based-access-control-rbac#create-auth-hook-to-apply-user-role)
- [Supabase Storage Schema & Roles](https://supabase.com/docs/guides/storage/schema/custom-roles)
- [Supabase Auth Hooks](https://supabase.com/docs/guides/auth/auth-hooks#local-development)

---
