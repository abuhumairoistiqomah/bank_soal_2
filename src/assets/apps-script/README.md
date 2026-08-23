# NEO ILMA - Google Apps Script Integration

This folder contains the standalone Google Apps Script (`Code.gs`) that powers the Google Sheets integration for NEO ILMA.

## Quick Setup Instructions

1. **Open your Google Sheet** containing your worksheet database (or create a new one).
2. Ensure the first row contains the required headers:
   ```text
   ID | Grade | Subject | Chapter | Topic | Type | Link
   ```
3. In Google Sheets, click **Extensions** > **Apps Script**.
4. Clear any existing code in the Apps Script editor and paste the entire content of [`Code.gs`](./Code.gs).
5. If your sheet tab name is not `Sheet1`, update `CONFIG.SHEET_NAME` at the top of `Code.gs`.
6. Click **Deploy** > **New deployment**.
7. In the deployment configuration:
   - Select type: **Web app**
   - Description: `NEO ILMA API`
   - Execute as: **Me** (`your-email@gmail.com`)
   - Who has access: **Anyone**
8. Click **Deploy**, authorize permissions if prompted, and copy the resulting **Web App URL** (ends with `/exec`).
9. In the NEO ILMA web app, open **Settings** (Database Settings), paste your Web App URL, and click **Save Configuration**.
