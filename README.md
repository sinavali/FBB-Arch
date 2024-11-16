# FBB-Arch

This repository contains the architecture for the FBB project, structured as follows:

- **composables/**: Helper functions for each pipeline.
- **utils/**: Similar to composables but these functions are singleton and ready to use with fresh state.
- **prisma/**: Database schema and ORM configurations.
- **streams/**: Functions for managing sockets and data from sockets.
- used in connecting to MT5 and retrive data and manipulating it.
- **lines/**: Managing the flow of the pipline (each file is a seperated pipeline).
- **validations/**: Includes data validation logic.
- **exports/**: A report of the positions opened and closed will be saved here when pipeline is done.
- **logs/**: Loggings and Errors in the flow will show in the console and saved in these files.
- **reports/**: Data in "export" folder will be moved and archived here.
- **routes/**: Express.js routing (not important).
- **views/**: Express.js views (not important).
