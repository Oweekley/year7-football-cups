# Year 7 Football Cups

This project provides a dashboard and bracket display for the Year 7 Football Cups competition, including Welsh Cup, Cardiff Cup, and Friendlies data.

## Key Features & Benefits

*   **Dashboard:** Provides an overview of the competition, including team selection and data filtering.
*   **Team Dashboard:** Displays detailed information about specific teams.
*   **Brackets:** Visual representation of the cup brackets for the Welsh and Cardiff Cups.
*   **Multi-language Support:** Includes English and Welsh language options.
*   **Dynamic Data Loading:** Fetches competition data from JSON files.

## Prerequisites & Dependencies

*   Web browser (Chrome, Firefox, Safari, etc.)
*   Text editor or IDE for code modification (VSCode, Sublime Text, etc.)

## Installation & Setup Instructions

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/Oweekley/year7-football-cups.git
    ```

2.  **Navigate to the project directory:**

    ```bash
    cd year7-football-cups
    ```

3.  **Open `index.html` in your web browser:**

    The dashboard should now be visible in your browser.

## Usage Examples & API Documentation

This project utilizes JavaScript to dynamically update the HTML content based on the data loaded from JSON files.

*   **`index.html`**: Main dashboard page with team selection and data filtering options.
*   **`teamCard.html`**: Displays team-specific information.
*   **`brackets.html`**: Shows the cup brackets.
*   **`script.js`**: Contains the JavaScript logic for data loading, filtering, language toggling, and rendering.
*   **`cardiff.json`**: Data for Cardiff Cup.
*   **`welsh.json`**: Data for Welsh Cup.
*   **`friendlies.json`**: Data for Friendlies matches.
*   **`teams.json`**: Data containing team names and details.
*   **`utils/`**: Contains utility functions for date manipulation, DOM manipulation, and statistics calculations.

```javascript
// Example: Accessing team data from teams.json
fetch('teams.json')
  .then(response => response.json())
  .then(data => {
    console.log(data); // Displays the team data in the console
  });

// Example: Translating text based on language selection
const translations = {
  en: {
    dashboardTitle: "Year 7 Cups Dashboard 2025",
  },
  cy: {
    dashboardTitle: "Bwrdd Gwaith Cwpanau Blwyddyn 7 2025",
  },
};

function translate(key, language) {
  return translations[language][key] || key;
}

console.log(translate("dashboardTitle", "cy")); // Outputs "Bwrdd Gwaith Cwpanau Blwyddyn 7 2025"
```

## Configuration Options

*   **JSON Data Files:** The data for cups, friendlies, and teams are stored in JSON files (`cardiff.json`, `welsh.json`, `friendlies.json`, `teams.json`).  You can modify these files to update the competition data.
*   **Language:** The language can be toggled between English and Welsh using the language selector in the UI.  The translations are defined in the `script.js` file.

## Contributing Guidelines

1.  Fork the repository.
2.  Create a new branch for your feature or bug fix.
3.  Make your changes.
4.  Commit your changes with descriptive commit messages.
5.  Push your changes to your fork.
6.  Submit a pull request to the main repository.

## License Information

License not specified. All rights reserved by Oweekley.

## Acknowledgments

*   This project utilizes JavaScript, HTML, and CSS.
*   Inspiration for the design and functionality comes from various sports dashboard examples.
