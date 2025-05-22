# Butterfly Buddy
**Version:** 4.0.1

Butterfly Buddy is a Google Chrome extension designed to help schools monitor and control students' web browsing, enforce safe browsing policies, and promote healthy online behavior. It leverages Manifest V3 capabilities to provide a secure, performant, and privacy-conscious solution for child safety on the internet.

---

## Table of Contents
1. [Key Features](#key-features)
2. [How It Helps Schools with Child Safety](#how-it-helps-schools-with-child-safety)
3. [Installation & Setup](#installation--setup)
4. [Configuration](#configuration)
5. [Usage](#usage)
6. [Permissions & Security](#permissions--security)
7. [Support & Contribution](#support--contribution)

---

## Key Features

1. **Website Blocking**
   - Blocks access to undesirable or non-educational websites defined in the school's block list.
   - Displays a polite "This site is blocked" page when students attempt to navigate to blocked domains.

2. **Controlled Site Access**
   - Allows time-limited access to social or entertainment sites configured as "controlled sites."
   - Tracks and enforces a daily maximum usage time per controlled site, helping students stay focused on learning tasks.

3. **Recommended & Safe Resources**
   - Displays a curated list of school-approved, educational websites on the extension's home page.
   - Encourages students to use high-quality, safe resources for study and research.

4. **Real-Time Status & Notifications**
   - Provides instant feedback on network connectivity (online/offline) via toast-style notifications.
   - Sends unobtrusive alerts for session time limits, disconnection events, and policy violations.

5. **Activity Monitoring & Reporting**
   - Logs visited pages and timestamps in Chrome storage for later review by educators.
   - Summarizes students' recently typed URLs (browser history) in the extension's sidebar view.
   - Exposes a "Site Info" button in the popup to quickly view the student's current page and first-visited timestamp.

6. **Manifest V3 & Modern JavaScript**
   - Uses a V3 service worker for background tasks—no persistent background page.
   - Implements secure `content_security_policy` and web-accessible resource declarations.
   - Leverages async/await, ES modules, and vanilla JavaScript for performance and maintainability.

---

## How It Helps Schools with Child Safety

- **Enforce Acceptable Use Policies**: Administrators can define a tailored block list of sites that are distracting, inappropriate, or harmful. Students are prevented from accessing these sites during school hours.

- **Manage Screen Time**: Time-limited access to social media or entertainment sites ensures that students spend appropriate time online for educational purposes.

- **Promote Positive Learning**: By highlighting a list of approved educational resources, the extension guides students toward constructive content.

- **Real-Time Alerts for Educators**: Toast notifications keep students informed of policy boundaries. Administrators can later review logs for compliance or intervention purposes.

- **Data Privacy & Security**: All browsing logs and configuration data remain within Chrome's secure storage. The extension does not transmit personal data to external servers (except optional telemetry endpoints under school control).

---

## Installation & Setup

1. **Clone or Download** the repository to your local machine.
2. Open Chrome and navigate to `chrome://extensions/`.
3. Enable **Developer mode** (toggle in the top-right corner).
4. Click **Load unpacked** and select the extension's root folder.
5. The **Butterfly Buddy** icon will appear in the toolbar—click to open.

---

## Configuration

All runtime settings are stored in the `data/config.json` file:

```json
{
  "username": "student_name",
  "school_name": "Your_School_Name",
  "class_id": "ClassIdentifier",
  "grade_div" : "Grade&Div",
  "allowed_websites": {
    "EducationalSite1": "https://www.example-edu.com",
    "Library": "https://library.school.org"
  },
  "blocked_websites": [
    "https://gaming.example.com",
    "https://social.example.com"
  ],
  "controlled_sites": [
    "https://facebook.com",
    "https://twitter.com"
  ],
  "controlled_sites_daily_max_time": "600"
}
```

- **blocked_websites**: List of domains to completely block.
- **allowed_websites**: Key-value map of recommended sites shown in the UI.
- **controlled_sites**: Domains allowed under a daily time limit (in seconds).
- **controlled_sites_daily_max_time**: Maximum seconds per day for all controlled sites.

> **Note**: After editing `config.json`, reload the extension in Chrome to apply changes.

---

## Usage

- **Home Page**: Click the toolbar icon, then **Homepage** to see welcome message, recommended sites, and search bar.
- **Options**: Use the **Options** link to access the extension's advanced settings page (if implemented).
- **Web Activity**: The extension displays a history of typed URLs from the past week.
- **Real-Time Blocking**: Attempting to visit a blocked site will redirect to a "This site is blocked" page.
- **Time Warnings**: When nearing or exceeding time limits on controlled sites, students receive a countdown and status updates.

---

## Permissions & Security

- **`<all_urls>` Host Permission**: Necessary to evaluate pages against block/control lists. Can be narrowed to specific domains if desired.
- **`history`**: Allows reading browser history for reporting typed URLs.
- **`storage`**: Saves configuration data and visit logs locally in Chrome.
- **`scripting`**: Injects content scripts to enforce policies and collect metrics.
- **`webNavigation`**: Monitors navigation events to log and enforce rules in real time.

> The extension uses a strict `content_security_policy` to only load scripts from its own package (`script-src 'self'`). No external code is injected except the optional educational scripts you define.

---

## Support & Contribution

- For issues or feature requests, please open an issue on the project's GitHub repository.
- Contributions are welcome via pull requests—please adhere to the existing code style and include tests where applicable.
- Schools deploying this extension at scale should consider customizing the codebase to integrate with campus authentication or logging systems.

---

**Butterfly Buddy** empowers educators and administrators to create a safer, more focused online environment for students, balancing access to educational resources with robust policy enforcement. 