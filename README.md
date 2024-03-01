# US Heart and Stroke Atlas Visualization

## Motivation

The "US Heart and Stroke Atlas Visualization" project is motivated by the necessity to offer accessible insights into the cardiovascular health landscape across the United States. Utilizing public health data, this application aims to uncover patterns and correlations between lifestyle, environmental factors, and the prevalence of heart-related diseases. Its ultimate goal is to empower public health professionals, researchers, and the general public with actionable insights, thereby improving health outcomes and informing policy decisions.

## Data

This project utilizes data from the **US Heart and Stroke Atlas**, which compiles county-level statistics on heart disease, stroke incidence, and related health and environmental factors. Metrics include median household income, education levels, air quality, access to parks, and prevalence rates of high blood pressure, smoking, and physical inactivity, among others. This comprehensive dataset allows for a multifaceted analysis of the factors influencing heart health across different communities.

**Data Source:** [US Heart and Stroke Atlas](https://www.cdc.gov/dhdsp/maps/atlas/index.htm) *(This link is illustrative)*

## Visualization Components

The application features several key visualization components, each offering a unique view into the dataset:

- **Distribution Comparison**: Dual histograms allow for the comparison of two selected attributes across all counties.
- **Correlation Analysis**: A scatterplot visualizes relationships between two selected attributes.
- **Spatial Distribution**: Choropleth maps display geographical patterns in selected health or environmental attributes.
- **Health and Environment Impact Analysis**: A radar chart compares multiple attributes for selected counties.

Users can interact with dropdown menus, brush tools, and clickable map regions. The visualizations dynamically update in response to these interactions, facilitating explorative data analysis.

## Discoveries

Users can uncover insights such as the impact of air quality on heart disease rates, the correlation between poverty levels and health outcomes, or the influence of park access on physical activity levels and overall heart health.

## Process

Built using **D3.js** for data-driven visualizations, along with **HTML** and **CSS** for the web interface. The code structure follows modular design principles for enhanced maintainability.

**Code Repository:** [GitHub link to project](#) *(This link is illustrative)*

The application can be run locally and accessed via a web browser.

## Future Works

Future enhancements could include more interactive elements, such as geographic region filtering or more detailed demographic data integration for deeper analysis.

## Challenges

Challenges included managing the asynchronous loading of large datasets and optimizing interactive elements' performance. Lessons learned involve the importance of efficient data structures and incremental development and testing.

## Demo Video

A demo video showcasing the application in action: [Demo Video Link](#) *(This link is illustrative)*

This video provides a guided tour of the project components, illustrating how users can interact with the application to derive meaningful insights from the data.

