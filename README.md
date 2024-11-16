# FBB-Arch

This repository contains the architecture for the FBB project, structured as follows:
Current architecture:
- **composables/**: Helper functions for each pipeline.
- **utils/**: Similar to composables but these functions are singleton and ready to use with fresh state.
- **prisma/**: Database schema and ORM configurations.
- **streams/**: Functions for managing sockets and data from sockets. used in connecting to MT5 and retrive data and manipulating it.
- **lines/**: Managing the flow of the pipline (each file is a seperated pipeline).
- **validations/**: Includes data validation logic.
- **exports/**: A report of the positions opened and closed will be saved here when pipeline is done.
- **logs/**: Loggings and Errors in the flow will show in the console and saved in these files.
- **reports/**: Data in "export" folder will be moved and archived here.
- **routes/**: Express.js routing (not important).
- **views/**: Express.js views (not important).
- **app.js**: Main logic for initiating the flow, logics like checking if is in backtest mode running pre flow functions. 


1. پروژه اول به صورت اسکریپتی بود و بعد از چند بار تغییر تصمیم گرفتم که معماری رو به این شکل پیاده کنم ولی بعد از یه مدت دیدم که جوابگو نیست ولی دیگه زمانی هم برای تغییر این معماری پیدا نکردم.
2. فعلا پروژه به صورت single-thread داره اجرا میشه و یک از عوامل کندیش همینه، البته منتظرم یه مقدار وضعیت استیبل شه که معماری رو عوض کنم و service-worker رو اضافه کنم که از این بابت هم خیالم راحت باشه.
3. دیتابیس رو هم باید عوض کنم و postgre رو پیاده سازی کنم بابت I/O بالا تر.
4. کوئری ها هم بهینه نیست یه سری جاها که دلیل اصلی کندی همینه، در اصل هر کندل نهایتا 35ms باید طول بکشه ولی به همین خاطر با زیاد شدن تعداد کندل ها تا 700ms هم میره بالا (که قائدتا توی بازنویسی پیداش میکنم و هندلش میکنم).
5. تست نویسی رو تا جای خوبی پیش برده بودم ولی توی یه بازه زمانی الگوریتک ها رو به شدت زیادی تغییر دادیم که باعث شد عملا تمام تست هام fail بشه و دیگه پیگیرشون نشدم (لاجیک تست تحت تاثیر قرار میگرفت و خروجی فانکشن ها عوض شد).
