const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// Path to your service account JSON file
const KEYFILEPATH = path.join(__dirname, 'path/to/your/service-account-file.json');

// Define the required Google Sheets API scope
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];

// Authenticate with the Google API using the service account
const auth = new google.auth.GoogleAuth({
  keyFile: 'credentials.json',
  scopes: SCOPES,
});

// Initialize the Sheets API client
const sheets = google.sheets({ version: 'v4', auth });

async function readSheet() {
  const spreadsheetId = '1ka3g3vvLWMIhXehlHFo1tvXI1ghAvzvoW4GZzxgvjOU';  // Replace with your spreadsheet ID
  const range = 'Sheet1!A1:D10';  // Replace with the range you want to access

  try {
    // Get data from the specified range in the Google Sheet
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const rows = res.data.values;
    if (rows.length === 0) {
      console.log('No data found.');
    } else {
      console.log('Data from sheet:');
      rows.map((row) => {
        console.log(row.join(', '));
      });
    }
  } catch (err) {
    console.error('The API returned an error: ' + err);
  }
}

readSheet();
