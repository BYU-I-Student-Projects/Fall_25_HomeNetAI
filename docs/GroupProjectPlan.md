# Group Project Plan | CSE 310—Applied Programming

|Unique Team Name|Team Member Names|
|-|-|
|Team 1|Diar SalehEthan|
|Team 1|TrentEthan|
|Team 1|McMasterIan|
|Team 1|Joshua Chapman|
|Team 1|Moroni Motta|
|Team 1|Nathan Luckock|
|Team 1|Tyler Burdett|

## IoT Smart Home Dashboard with AI Monitoring <!-- Title(name) of the Project -->


### Description
<!-- Describe the program you will create. What is the objective of the software? What kind of Database are you planning to use? What Platform are you using? What languages are you using? What frameworks might you use? -->
The IoT Smart Home Dashboard will combine real-time weather data and simulated smart
home sensor data into a single platform. Data will be collected hourly, stored in a SQL
database, and accessed via REST API. AI/ML models will add predictive insights,
anomaly detection, and chatbot support. A notification system will provide users with timely
alerts.

Goals:
- Provide a functional dashboard that merges environmental and smart home data.
- Enable interactive controls and insights through AI.
- Create a scalable foundation for real-world sensor integration in the future.



### Requirements:
2.1 Data Retrieval (Weather + Simulation)
- Weather API: Open Meteo (hourly + current forecast).
- Simulated Sensors: Indoor temperature, humidity, motion, energy usage, and additional
metrics as needed.
- Frequency: Pull or generate new data every hour.
- Tech: Python scripts for both API and simulation.
- Requirements:
  - Ensure retry logic if API fails.
  - Generate consistent simulated sensor readings (e.g., within plausible ranges).

2.2 Data Storage (SQL Database)
- Database: SQLite for MVP, optional migration to PostgreSQL.
- Tables:
  - users (user profile, preferences).
  - devices (list of simulated devices).
  - readings (time-series sensor values).
  - weather_data (hourly forecasts & current).
  - notifications (alerts, logs).
- Requirements:
  - Support time-series queries.
  - Maintain referential integrity between users, devices, and readings.
  - Enable historical analysis for ML models.

2.3 API & Backend Services
- Framework: FastAPI (Python)
- Endpoints:
  - Authentication: Register, Login, User Management
  - Locations: Search, Add, Delete user locations
  - Weather: Current weather and forecasts for locations
  - Data: Historical data access
- Requirements:
  - RESTful API design
  - JWT authentication
  - PostgreSQL database integration
  - CORS enabled for client access

2.4 AI & Machine Learning
- Chatbot:
  - Answer simple queries about home conditions or weather.
  - Integration with GPT API (subscription available).
- Models:
  - Energy usage prediction (time, day, temp).
  - Anomaly detection (temperature spikes, unexpected usage).
  - Future clustering (behavior patterns).
- Tech: Python (scikit-learn, pandas).
- Requirements:
  - MVP: At least one functional predictive model.
  - Lightweight chatbot integration.
  - Training pipeline from stored database.

2.5 Notification System
- Delivery: ntfy.sh push notifications (mobile + desktop).
- Triggers:
  - Motion detected when user away.
  - Energy spikes.
  - Severe weather alerts.
- Preferences:
  - Threshold-based alerts (user-defined).
  - Opt-in/opt-out settings.
- Requirements:
  - Store logs in notifications table.
  - Handle errors gracefully (retry if failed to send).

### Determine Team Roles (Optional)
Assign roles to each team member. If you have fewer than 6 people, then some team members will need to have 2 roles.  Refer to the Team Project Description in I-Learn for a description of each role.

|Role             |Team Member Name|
|-----------------|----------------|
|Team Leader      | |
|Project Manager  | |
|Graphic Designer | |
|Quality Assurance| |
|DevOps           | |	
|Scrum Master     | |

### Github
As a team, start to draft issues based on your understanding of the team project.  Include tasks related to planning, researching, implementing requirements, and testing.  Researching includes anything that you do not currently know how to do as well as the creation of prototypes. The Project Manager should maintain this Project board throughout the semester.  You will need to add more Issues and move existing Issues to different columns as the project progresses.  

- Github [Repository](https://github.com/mcm23016/CSE-310-Repository)
- Github [Project](https://github.com/users/mcm23016/projects/1)

#### TODOs
- [X] We have started to add some of the stories and features(milestones) to the project board and repository that will get us through sprint 1 and some of sprint 2
- [X] We have added the professor and ta to the Repository 
- [X] We have added the professor and ta to the Project Board
- [X] We know the general order in which each feature and their stories should be worked in
- [X] This file is saved in our github Repository

<!-- Create this Markdown to a PDF and submit it. In visual studio code you can convert this to a pdf with any one of the extensions. -->
<!-- ONLY One person from your team needs to turn this in. -->
